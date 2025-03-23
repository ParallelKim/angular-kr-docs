/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {Injectable, computed, inject, signal} from '@angular/core';
import {VERSIONS_CONFIG} from '../constants/versions';
import {WINDOW} from '@angular/docs';
import {CURRENT_MAJOR_VERSION} from '../providers/current-version';

export interface Version {
  displayName: string;
  version: VersionMode;
  url: string;
}

export type VersionMode = 'stable' | 'deprecated' | 'rc' | 'next' | number;

export const INITIAL_ADEV_DOCS_VERSION = 18;
export const VERSION_PLACEHOLDER = '{{version}}';
export const MODE_PLACEHOLDER = '{{prefix}}';

@Injectable({
  providedIn: 'root',
})
export class VersionManager {
  private readonly currentMajorVersion = 19;

  versions = signal<Version[]>([
    ...this.getRecentVersions(),
    ...this.getAdevVersions(),
    ...this.getAioVersions(),
  ]);

  currentDocsVersion = computed(() => {
    // 현재 메이저 버전과 정확히 일치하는 버전 찾기
    return this.versions().find((version) => version.version === this.currentMajorVersion);
  });

  // List of Angular Docs versions which includes current version, next and rc.
  private getRecentVersions(): Version[] {
    return [
      {
        url: this.getAdevDocsUrl('next'),
        displayName: `next`,
        version: 'next',
      },
      // Note: 'rc' should not be visible for now
      // {
      //   url: this.getAdevDocsUrl('rc'),
      //   displayName: `rc`,
      //   version: 'rc',
      // },
      {
        url: '/',
        displayName: 'v19',
        version: 19,
      },
    ];
  }

  // List of Angular Docs versions hosted on angular.dev domain.
  private getAdevVersions(): Version[] {
    const adevVersions: Version[] = [];
    for (
      let version = this.currentMajorVersion - 1;
      version >= INITIAL_ADEV_DOCS_VERSION;
      version--
    ) {
      adevVersions.push({
        // 원본 앵귤러 문서 사이트로 링크 (v{version}.angular.dev)
        url: `https://v${version}.angular.dev`,
        displayName: this.getVersion(version),
        version: version,
      });
    }
    return adevVersions;
  }

  // List of Angular Docs versions hosted on angular.io domain.
  private getAioVersions(): Version[] {
    return VERSIONS_CONFIG.aioVersions.map((item) => {
      // 버전에서 'v' 접두사 제거 후 숫자로 변환
      const versionNum = parseInt(item.version.toString().replace(/^v/, ''));
      return {
        url: item.url,
        displayName: this.getVersion(versionNum),
        version: versionNum,
      };
    });
  }

  private getVersion(versionMode: VersionMode): string {
    if (versionMode === 'stable' || versionMode === 'deprecated') {
      return `v${this.currentMajorVersion}`;
    }
    if (Number.isInteger(versionMode)) {
      return `v${versionMode}`;
    }
    return versionMode.toString();
  }

  private getAdevDocsUrl(version: VersionMode): string {
    const docsUrlPrefix = isNaN(Number(version)) ? `` : 'v';

    return VERSIONS_CONFIG.aDevVersionsLinkPattern
      .replace(MODE_PLACEHOLDER, docsUrlPrefix)
      .replace(
        VERSION_PLACEHOLDER,
        `${version.toString() === 'stable' ? '' : `${version.toString()}.`}`,
      );
  }
}
