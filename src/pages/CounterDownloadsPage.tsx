import { useState } from 'react'
import releases from '../lib/desktop-releases.json'
import trials from '../lib/desktop-trials.json'
import { acceptedDesktopDownload, authorizedTrialDownload } from '../lib/desktop-download'
import { ToolFrame } from './ToolsPage'

export function CounterDownloadsPage() {
 const [platform,setPlatform]=useState<'windows'|'macos'>('windows')
 const [detail,setDetail]=useState<'setup'|'limits'|'verify'>('setup')
 const release=releases[platform], trial=trials[platform]
 const finalFile=acceptedDesktopDownload(release)
 const file=finalFile ?? authorizedTrialDownload(trial)
 const published=finalFile ? release : trial
 return <ToolFrame><main id="tool-content" className="download-screen">
 <div className="download-title"><p className="tool-eyebrow">GATE DESK / 01</p><h1>CCTV<br/><em>Counter.</em></h1><p className="download-status">{finalFile?'Complete installer':trial.status}</p><p className="download-essential">{finalFile?'Runtime, dependencies and counting model included.':'Bundled test packages. Not final factory releases.'}</p></div>
 <section className="download-panel" aria-label="Desktop downloads"><div className="platform-switch" aria-label="Choose your computer"><button aria-pressed={platform==='windows'} onClick={()=>setPlatform('windows')}>Windows</button><button aria-pressed={platform==='macos'} onClick={()=>setPlatform('macos')}>Mac</button></div>
 <div className="platform-identity"><span>{platform==='windows'?'⊞':'◉'}</span><div><h2>{release.title}</h2><p>{release.platform}</p></div><small>{published.size}</small></div>
 <nav className="detail-tabs" aria-label="Download information">{(['setup','limits','verify'] as const).map(tab=><button key={tab} aria-pressed={detail===tab} onClick={()=>setDetail(tab)}>{tab==='setup'?'Setup':tab==='limits'?'Release status':'Checksum'}</button>)}</nav>
 <div className="download-info" aria-live="polite">{detail==='setup'?<><h3>{finalFile?'Included in your download':platform==='windows'?'Install the Windows trial':'Check your Mac first'}</h3><p>{finalFile?'Python, dependencies and the counting model come with the installer.':trial.setup}</p></>:detail==='limits'?<><h3>{published.status}</h3><p>{published.description}</p><p>₹200/month planned. Payments are disabled.</p></>:<><h3>SHA-256</h3>{file?<><code>{published.sha256}</code><p>Compare this with the downloaded file’s hash.</p></>:<p>No verified file is available.</p>}</>}</div>
 {file?<a className="stage-cta" href={file.href} download={file.pathname.split('/').pop()}>{finalFile?`Download ${release.title}`:trial.button} <span>↓</span></a>:<button className="stage-cta" disabled>Download unavailable</button>}
 <p className="download-note">Factory footage stays on your authorized devices. <a href="https://github.com/harshvardhanpareekofficial-maker/swadcost-pwa/releases/tag/gate-desk-desktop-trials-20261024">Package notes</a></p>
 </section></main></ToolFrame>
}
