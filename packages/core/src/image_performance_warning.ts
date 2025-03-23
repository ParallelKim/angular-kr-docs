/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {IMAGE_CONFIG, ImageConfig} from './application/application_tokens';
import {Injectable} from './di';
import {inject} from './di/injector_compatibility';
import {formatRuntimeError, RuntimeErrorCode} from './errors';
import {OnDestroy} from './interface/lifecycle_hooks';
import {getDocument} from './render3/interfaces/document';

// onLoad 후 스캔이 실행되기 전에 밀리초로 지연 시간을 두어,
// LCP 관련 다른 함수들과의 잠재적인 경합 조건을 피합니다. 이 지연은
// 주 JavaScript 실행 외부에서 발생하며, 경고가 콘솔에서 보이는
// 시점에만 영향을 미칩니다.
const SCAN_DELAY = 200;

const OVERSIZED_IMAGE_TOLERANCE = 1200;

@Injectable({providedIn: 'root'})
export class ImagePerformanceWarning implements OnDestroy {
  // 전체 이미지 URL -> 원래 `ngSrc` 값의 맵.
  private window: Window | null = null;
  private observer: PerformanceObserver | null = null;
  private options: ImageConfig = inject(IMAGE_CONFIG);
  private lcpImageUrl?: string;

  public start() {
    if (
      (typeof ngServerMode !== 'undefined' && ngServerMode) ||
      typeof PerformanceObserver === 'undefined' ||
      (this.options?.disableImageSizeWarning && this.options?.disableImageLazyLoadWarning)
    ) {
      return;
    }
    this.observer = this.initPerformanceObserver();
    const doc = getDocument();
    const win = doc.defaultView;
    if (win) {
      this.window = win;
      // 경합 조건을 피하기 위해 기다립니다. 여기서 LCP 이미지가
      // 성능 관찰자로 기록되기 전에 load 이벤트를 트리거합니다.
      const waitToScan = () => {
        setTimeout(this.scanImages.bind(this), SCAN_DELAY);
      };
      const setup = () => {
        // 애플리케이션이 여러 번 생성 및 파괴되는 경우를 고려합니다.
        // 일반적으로, 애플리케이션은 페이지가 로드되면 즉시 생성되며,
        // `window.load` 리스너는 항상 트리거됩니다. 그러나, `window.load` 이벤트는
        // 페이지가 로드되었고, 애플리케이션이 나중에 생성되면 발생하지 않습니다.
        // `readyState`를 확인하는 것이 페이지가 로드되었는지 확인하는
        // 가장 쉬운 방법입니다.
        if (doc.readyState === 'complete') {
          waitToScan();
        } else {
          this.window?.addEventListener('load', waitToScan, {once: true});
        }
      };
      // Angular는 이 기능의 범위 내에서 비동기 작업이 호출될 때마다
      // 변경 감지를 실행할 필요가 없습니다.
      if (typeof Zone !== 'undefined') {
        Zone.root.run(() => setup());
      } else {
        setup();
      }
    }
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  private initPerformanceObserver(): PerformanceObserver | null {
    if (typeof PerformanceObserver === 'undefined') {
      return null;
    }
    const observer = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length === 0) return;
      // 우리는 `PerformanceObserver`에 의해 생성된 최신 항목을 LCP 요소가 실제로
      // 무엇인지에 대한 가장 좋은 신호로 사용합니다. 예를 들어, 페이지에서 로드되는
      // 최초의 이미지는 현재 페이지에서 유일한 요소로 인해 LCP 후보가 될 수 있으며,
      // PerformanceObserver에 의해 보고되지만 반드시 LCP 요소는 아닙니다.
      const lcpElement = entries[entries.length - 1];

      // `LargestContentfulPaint` 유형의 항목에서 `element`가 누락되어 `any`로 캐스팅합니다.
      // https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint 를 참조하세요.
      const imgSrc = (lcpElement as any).element?.src ?? '';

      // `data:`와 `blob:` URL은 가져온 리소스이므로 제외합니다.
      if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:')) return;
      this.lcpImageUrl = imgSrc;
    });
    observer.observe({type: 'largest-contentful-paint', buffered: true});
    return observer;
  }

  private scanImages(): void {
    const images = getDocument().querySelectorAll('img');
    let lcpElementFound,
      lcpElementLoadedCorrectly = false;
    images.forEach((image) => {
      if (!this.options?.disableImageSizeWarning) {
        // NgOptimizedImage 지시어를 사용하는 이미지 요소는 제외되며,
        // 해당 지시어에는 이 체크의 고유 버전이 있습니다.
        if (!image.getAttribute('ng-img') && this.isOversized(image)) {
          logOversizedImageWarning(image.src);
        }
      }
      if (!this.options?.disableImageLazyLoadWarning && this.lcpImageUrl) {
        if (image.src === this.lcpImageUrl) {
          lcpElementFound = true;
          if (image.loading !== 'lazy' || image.getAttribute('ng-img')) {
            // 이 변수는 true로 설정되고 다시 false로 돌아가지 않으므로,
            // 여러 이미지가 같은 src url을 가지며, 일부는
            // 지연 로드되고 다른 일부는 그렇지 않다는 경우를 설명합니다.
            // 또한 NgOptimizedImage를 무시하므로 이에 대한 경고가 다릅니다.
            lcpElementLoadedCorrectly = true;
          }
        }
      }
    });
    if (
      lcpElementFound &&
      !lcpElementLoadedCorrectly &&
      this.lcpImageUrl &&
      !this.options?.disableImageLazyLoadWarning
    ) {
      logLazyLCPWarning(this.lcpImageUrl);
    }
  }

  private isOversized(image: HTMLImageElement): boolean {
    if (!this.window) {
      return false;
    }

    // `isOversized` 체크는 여러 유형의 이미지 포맷 또는 시나리오에 대해 적용 불가하거나
    // 조정이 필요할 수 있습니다. 현재 우리는 오직 `svg`만 지정하지만,
    // 이는 `gif`도 포함될 수 있습니다. 왜냐하면 그들의 품질이
    // 래스터 이미지와 같은 방식으로 크기에 묶이지 않기 때문입니다.
    const nonOversizedImageExtentions = [
      // SVG 이미지는 벡터 기반으로, 품질을 잃지 않고
      // 모든 크기로 스케일할 수 있습니다.
      '.svg',
    ];

    // 대문자가 있는 확장을 처리하기 위해 소문자로 변환합니다.
    // `src`가 `null`로 명시적으로 설정된 경우,
    // `undefined`일 수 있으므로 빈 문자열로 폴백합니다.
    const imageSource = (image.src || '').toLowerCase();

    if (nonOversizedImageExtentions.some((extension) => imageSource.endsWith(extension))) {
      return false;
    }

    const computedStyle = this.window.getComputedStyle(image);
    let renderedWidth = parseFloat(computedStyle.getPropertyValue('width'));
    let renderedHeight = parseFloat(computedStyle.getPropertyValue('height'));
    const boxSizing = computedStyle.getPropertyValue('box-sizing');
    const objectFit = computedStyle.getPropertyValue('object-fit');

    if (objectFit === `cover`) {
      // 객체 맞춤 `cover`는 이 경고가 적용되지 않는 스프라이트 시트 같은 사용 사례를 나타낼 수 있습니다.
      return false;
    }

    if (boxSizing === 'border-box') {
      // 이미지 `box-sizing`이 `border-box`로 설정된 경우,
      // 패딩 값을 빼서 렌더링된 치수를 조정합니다.
      const paddingTop = computedStyle.getPropertyValue('padding-top');
      const paddingRight = computedStyle.getPropertyValue('padding-right');
      const paddingBottom = computedStyle.getPropertyValue('padding-bottom');
      const paddingLeft = computedStyle.getPropertyValue('padding-left');
      renderedWidth -= parseFloat(paddingRight) + parseFloat(paddingLeft);
      renderedHeight -= parseFloat(paddingTop) + parseFloat(paddingBottom);
    }

    const intrinsicWidth = image.naturalWidth;
    const intrinsicHeight = image.naturalHeight;

    const recommendedWidth = this.window.devicePixelRatio * renderedWidth;
    const recommendedHeight = this.window.devicePixelRatio * renderedHeight;
    const oversizedWidth = intrinsicWidth - recommendedWidth >= OVERSIZED_IMAGE_TOLERANCE;
    const oversizedHeight = intrinsicHeight - recommendedHeight >= OVERSIZED_IMAGE_TOLERANCE;
    return oversizedWidth || oversizedHeight;
  }
}

function logLazyLCPWarning(src: string) {
  console.warn(
    formatRuntimeError(
      RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING,
      `src ${src}인 이미지는 가장 큰 콘텐츠 페인트(LCP) 요소이지만, ` +
        `부하 값이 "lazy"로 주어져 있습니다. 이는 애플리케이션 로딩 성능에 부정적인 영향을 줄 수 있습니다. ` +
        `이 경고는 LCP 이미지의 로딩 값을 "eager"로 변경하거나, ` +
        `NgOptimizedImage 지시어의 우선 순위 유틸리티를 사용하여 처리할 수 있습니다. ` +
        `이 경고를 처리하거나 비활성화하는 방법에 대한 자세한 내용은 ` +
        `https://angular.dev/errors/NG0913을 참조하세요.`,
    ),
  );
}

function logOversizedImageWarning(src: string) {
  console.warn(
    formatRuntimeError(
      RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING,
      `src ${src}인 이미지는 본래 파일 크기가 렌더링된 크기보다 훨씬 큽니다. ` +
        `이는 애플리케이션 로딩 성능에 부정적인 영향을 줄 수 있습니다. ` +
        `이 경고를 처리하거나 비활성화하는 방법에 대한 자세한 내용은 ` +
        `https://angular.dev/errors/NG0913을 참조하세요.`,
    ),
  );
}
