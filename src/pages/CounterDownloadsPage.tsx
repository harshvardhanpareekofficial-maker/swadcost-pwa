import { Link } from 'react-router-dom'
import releases from '../lib/desktop-releases.json'
import { CounterDrawing, ToolFrame } from './ToolsPage'

type Release = { title: string; platform: string; status: string; description: string; url: string | null; sha256: string | null; size: string | null; button: string }

function PlatformDownload({ release }: { release: Release }) {
  const available = !!release.url && release.url.startsWith('https://') && /^[a-f0-9]{64}$/.test(release.sha256 ?? '')
  const file = available ? new URL(release.url!) : null
  // Keep our hosted files same-origin on both the custom domain and previews.
  const href = file?.origin === 'https://harshvardhanpareek.com' ? file.pathname : release.url!
  return <article className="platform-download"><div className="platform-heading"><h2>{release.title}</h2><span>{release.platform}</span></div><p className="release-status">{release.status}</p><p className="release-description">{release.description}</p>
    {available ? <a className="download-action" href={href} download={file!.pathname.split('/').pop()}>{release.button} <span aria-hidden>↓</span></a> : <button className="download-action" type="button" disabled>Download not available yet</button>}
    <p className="download-detail">{available ? `${release.size} · Setup preview` : 'A download will appear here when the package is prepared.'}</p>
    {available && <details className="download-checksum"><summary>Verify your download</summary><p>SHA-256</p><code>{release.sha256}</code></details>}
  </article>
}

export function CounterDownloadsPage() {
  return <ToolFrame><main id="tool-content" className="counter-main">
    <Link to="/" className="tool-back">← All tools</Link>
    <section className="counter-intro"><div><p className="tool-eyebrow">GATE DESK / CCTV COUNTER</p><h1>Your gate passes.<br/><span>Your camera evidence.</span></h1><p>A desktop workspace for owners, with phone access being built for owners and workers. Start with the setup for your factory computer.</p></div><div className="counter-illustration"><CounterDrawing/><span>DESKTOP AT THE FACTORY · PHONE ON THE MOVE</span></div></section>
    <aside className="pilot-notice"><strong>Factory pilot, still in development.</strong><p>These are setup previews, not a production counting system. Automatic counting is not ready for operational decisions. No factory counting accuracy is claimed.</p></aside>
    <section className="download-platforms" aria-label="Desktop downloads"><PlatformDownload release={releases.windows}/><PlatformDownload release={releases.macos}/></section>
    <section className="counter-plan" aria-label="Planned subscription"><div><p className="tool-eyebrow">PLANNED GATE DESK SUBSCRIPTION</p><h2>₹200 <span>/ month</span></h2></div><p>Payments are not enabled for this preview. AutoPay will require your explicit approval through a supported payment provider before any recurring charge.</p></section>
    <section className="counter-explainer"><h2>One factory. Connected records.</h2><div><article><h3>Owner on the computer</h3><p>The desktop is the place for CCTV setup, processing and reviewing incoming and outgoing records.</p></article><article><h3>Owner or worker on the phone</h3><p>Owner sign-in and worker invitation codes are being prepared for Android and iPhone. Device testing is still pending.</p></article><article><h3>Keep pending work visible</h3><p>When the computer is off, phone saves remain pending. Recorded-footage catch-up and off-site synchronization still need factory testing.</p></article></div></section>
    <div className="counter-privacy"><span aria-hidden>↳</span><p>Factory footage, gate-pass photographs and credentials belong on your authorized devices. This website distributes setup files; it does not receive CCTV footage.</p></div>
  </main></ToolFrame>
}
