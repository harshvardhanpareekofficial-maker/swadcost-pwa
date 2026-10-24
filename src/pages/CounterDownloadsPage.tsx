import { useState } from 'react'
import releases from '../lib/desktop-releases.json'
import { acceptedDesktopDownload } from '../lib/desktop-download'
import { ToolFrame } from './ToolsPage'
export function CounterDownloadsPage() {
 const [platform,setPlatform]=useState<'windows'|'macos'>('windows')
 const [detail,setDetail]=useState<'setup'|'limits'|'verify'>('setup')
 const release=releases[platform], file=acceptedDesktopDownload(release)
 const available=!!file
 const href=file?.origin==='https://harshvardhanpareek.com'?file.pathname:file?.href
 return <ToolFrame><main id="tool-content" className="download-screen">
 <div className="download-title"><p className="tool-eyebrow">GATE DESK / 01</p><h1>CCTV<br/><em>Counter.</em></h1><p className="download-status">{available?'Complete installer':'Installer in preparation'}</p><p className="download-essential">{available?'Runtime, dependencies and counting model included.':'Factory downloads are not ready yet. Earlier source previews are no longer offered here.'}</p></div>
 <section className="download-panel" aria-label="Desktop downloads"><div className="platform-switch" aria-label="Choose your computer"><button aria-pressed={platform==='windows'} onClick={()=>setPlatform('windows')}>Windows</button><button aria-pressed={platform==='macos'} onClick={()=>setPlatform('macos')}>Mac</button></div>
 <div className="platform-identity"><span>{platform==='windows'?'⊞':'◉'}</span><div><h2>{release.title}</h2><p>{release.platform}</p></div><small>{release.size}</small></div>
 <nav className="detail-tabs" aria-label="Download information">{(['setup','limits','verify'] as const).map(tab=><button key={tab} aria-pressed={detail===tab} onClick={()=>setDetail(tab)}>{tab==='setup'?'Setup':tab==='limits'?'Release status':'Checksum'}</button>)}</nav>
 <div className="download-info" aria-live="polite">{detail==='setup'?<><h3>{available?'Included in your download':'The complete package is being prepared'}</h3><p>{available?'Python, dependencies and the counting model come with the installer.':'The planned installer includes Python, dependencies and the counting model. No separate Python installation or setup-time downloads will be required.'}</p></>:detail==='limits'?<><h3>{release.status}</h3><p>{release.description}</p><p>₹200/month planned. Payments are disabled.</p></>:<><h3>SHA-256</h3>{available?<><code>{release.sha256}</code><p>Compare this with the downloaded file’s hash.</p></>:<p>The checksum will appear with the accepted installer.</p>}</>}</div>
 {available?<a className="stage-cta" href={href} download={file!.pathname.split('/').pop()}>Download {release.title} <span>↓</span></a>:<button className="stage-cta" disabled>Installer not available yet</button>}
 <p className="download-note">Factory footage stays on your authorized devices.</p>
 </section></main></ToolFrame>
}
