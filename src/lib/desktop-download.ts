type DesktopRelease = {
  url: string | null
  sha256: string | null
  releaseApproved: boolean
  runtimeIncluded: boolean
  modelIncluded: boolean
  installationAccepted: boolean
  phoneSyncAccepted: boolean
}

// Metadata must be populated from acceptance of the exact published bytes.
// A URL and checksum alone never turn a source preview into a finished app.
export function acceptedDesktopDownload(release: DesktopRelease): URL | null {
  if (!release.releaseApproved || !release.runtimeIncluded || !release.modelIncluded
      || !release.installationAccepted || !release.phoneSyncAccepted
      || !release.url || !/^[a-f0-9]{64}$/.test(release.sha256 ?? '')) return null
  try {
    const url = new URL(release.url)
    return url.protocol === 'https:' && !url.username && !url.password ? url : null
  } catch { return null }
}
