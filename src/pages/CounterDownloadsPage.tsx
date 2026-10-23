import { useState } from 'react'
import releases from '../lib/desktop-releases.json'
import { ToolFrame } from './ToolsPage'
export function CounterDownloadsPage() {
 const [platform,setPlatform]=useState<'windows'|'macos'>('windows')
 const [detail,setDetail]=useState<'setup'|'limits'|'verify'>('setup')
 const release=releases[platform], file=release.url?new URL(release.url):null
 const available=!!file && file.protocol==='https:' && /^[a-f0-9]{64}$/.test(release.sha256??'')
 const href=file?.origin==='https://harshvardhanpareek.com'?file.pathname:release.url
 return <ToolFrame><main id="tool-content" className="download-screen">
 <div className="download-title"><p className="tool-eyebrow">GATE DESK / 01</p><h1>CCTV<br/><em>Counter.</em></h1><p className="download-status">Source preview · In development</p><p className="download-essential">Not ready for factory counting.<br/>Runtime and counting model are not included.</p></div>
 <section className="download-panel" aria-label="Desktop downloads"><div className="platform-switch" aria-label="Choose your computer"><button aria-pressed={platform==='windows'} onClick={()=>setPlatform('windows')}>Windows</button><button aria-pressed={platform==='macos'} onClick={()=>setPlatform('macos')}>Mac</button></div>
 <div className="platform-identity"><span>{platform==='windows'?'⊞':'◉'}</span><div><h2>{release.title}</h2><p>{release.platform}</p></div><small>{release.size}</small></div>
 <nav className="detail-tabs" aria-label="Download information">{(['setup','limits','verify'] as const).map(tab=><button key={tab} aria-pressed={detail===tab} onClick={()=>setDetail(tab)}>{tab==='setup'?'Requirements':tab==='limits'?'Preview limits':'Checksum'}</button>)}</nav>
 <div className="download-info" aria-live="polite">{detail==='setup'?<><h3>Before you download</h3><p>Requires an existing reviewed Python 3.12.14 {platform==='windows'?'x64':'arm64'} environment and internet for setup.</p><p>Python.org has no binary installer for this version.</p></>:detail==='limits'?<><h3>{platform==='windows'?'Clean-PC setup is unverified.':'Native Mac testing is pending.'}</h3><p>These ZIPs contain source and setup scripts. They are not complete installers. {platform==='macos'?'Phone TLS is unsupported in this preview.':'Physical-phone and off-site sync testing remain pending.'}</p><p>₹200/month planned. Payments are disabled.</p></>:<><h3>SHA-256</h3><code>{release.sha256}</code><p>Compare this with the downloaded ZIP’s hash.</p></>}</div>
 {available?<a className="stage-cta" href={href} download={file!.pathname.split('/').pop()}>Download {release.title} preview <span>↓</span></a>:<button disabled>Download unavailable</button>}
 <p className="download-note">Factory footage stays on your authorized devices.</p>
 </section></main></ToolFrame>
}
