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

// Requested test-package publication does not grant final-release acceptance.
export function authorizedTrialDownload(trial: {
  kind: string; publicationAuthorized: boolean; url: string; sha256: string
}): URL | null {
  if (!trial.publicationAuthorized || !['windows-trial', 'mac-qualification', 'android-dev'].includes(trial.kind)
      || !/^[a-f0-9]{64}$/.test(trial.sha256)) return null
  try {
    const url = new URL(trial.url)
    return url.origin === 'https://github.com' && !url.username && !url.password
      && url.pathname.startsWith('/harshvardhanpareekofficial-maker/swadcost-pwa/releases/download/')
      && url.pathname.endsWith(trial.kind === 'android-dev' ? '.apk' : '.zip') && !url.search && !url.hash ? url : null
  } catch { return null }
}
