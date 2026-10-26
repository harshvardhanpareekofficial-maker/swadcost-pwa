import { describe, expect, it } from 'vitest'
import { acceptedDesktopDownload, authorizedTrialDownload } from './desktop-download'
import releases from './desktop-releases.json'
import trials from './desktop-trials.json'

const candidate = {
  url: 'https://example.com/installer.zip', sha256: 'a'.repeat(64),
  releaseApproved: true, runtimeIncluded: true, modelIncluded: true,
  installationAccepted: true, phoneSyncAccepted: true,
}

describe('accepted desktop downloads', () => {
  it('does not offer either currently unaccepted package', () => {
    expect(acceptedDesktopDownload(releases.windows)).toBeNull()
    expect(acceptedDesktopDownload(releases.macos)).toBeNull()
  })
  it.each(['releaseApproved', 'runtimeIncluded', 'modelIncluded', 'installationAccepted', 'phoneSyncAccepted'])('requires %s even with a valid URL and checksum', key => {
    expect(acceptedDesktopDownload({ ...candidate, [key]: false })).toBeNull()
  })
  it.each(['broken', 'http://example.com/installer.zip', 'https://user:secret@example.com/file.zip'])('refuses invalid download %s', url => {
    expect(acceptedDesktopDownload({ ...candidate, url })).toBeNull()
  })
  it('requires an exact digest and permits an accepted HTTPS artifact', () => {
    expect(acceptedDesktopDownload({ ...candidate, sha256: null })).toBeNull()
    expect(acceptedDesktopDownload(candidate)?.href).toBe(candidate.url)
  })
})

describe('authorized trial downloads', () => {
  it('offers the requested files without promoting either final release', () => {
    for (const platform of ['windows', 'macos'] as const) {
      expect(authorizedTrialDownload(trials[platform])?.href).toBe(trials[platform].url)
      expect(acceptedDesktopDownload(releases[platform])).toBeNull()
    }
  })
  it('requires publication authorization and a test-package kind', () => {
    expect(authorizedTrialDownload({ ...trials.windows, publicationAuthorized: false })).toBeNull()
    expect(authorizedTrialDownload({ ...trials.windows, kind: 'final' })).toBeNull()
  })
  it.each(['https://example.com/file.zip', 'https://github.com/another-owner/project/releases/download/v1/a.zip', 'https://github.com/harshvardhanpareekofficial-maker/swadcost-pwa/releases/download/v1/a.zip?token=secret'])('rejects an unexpected destination %s', url => {
    expect(authorizedTrialDownload({ ...trials.windows, url })).toBeNull()
  })
})


describe('Android APK publication', () => {
  it('offers the exact authorized development APK', () => {
    expect(authorizedTrialDownload(trials.android)?.href).toBe(trials.android.url)
    expect(authorizedTrialDownload({...trials.android, publicationAuthorized:false})).toBeNull()
  })
  it('keeps APK and desktop artifact extensions separate', () => {
    expect(authorizedTrialDownload({...trials.android, url:trials.windows.url})).toBeNull()
    expect(authorizedTrialDownload({...trials.windows, url:trials.android.url})).toBeNull()
  })
})
