/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

const markedFeatures = new Set<string>();

// tslint:disable:ban
/**
 * 기능 표시를 위한 보호된 `performance.mark`.
 *
 * 이 메서드는 Angular에서 지원하는 모든 브라우저 및 node.js 버전이
 * performance.mark API를 지원하지만, JSDOM 및 Cloudflare 작업자와 같은
 * 다른 환경에서는 그렇지 않기 때문에 존재합니다.
 */
export function performanceMarkFeature(feature: string): void {
  if (markedFeatures.has(feature)) {
    return;
  }
  markedFeatures.add(feature);
  performance?.mark?.('mark_feature_usage', {detail: {feature}});
}
