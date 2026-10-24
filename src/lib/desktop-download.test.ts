import { describe, expect, it } from 'vitest'
import { acceptedDesktopDownload } from './desktop-download'
import releases from './desktop-releases.json'

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
