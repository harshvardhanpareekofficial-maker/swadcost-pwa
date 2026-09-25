import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Eyebrow } from './SectionLabel'
import { StudioBar } from './StudioBar'
type Props={children:ReactNode;eyebrow?:string;title?:string;subtitle?:string;onLogout?:()=>void;onBack?:()=>void;backLabel?:string;stickyFooter?:ReactNode}
export function Layout({children,eyebrow,title,subtitle,onLogout,onBack,backLabel,stickyFooter}:Props) {
  return <div className="studio-atmosphere workspace-shell text-ink">
    <StudioBar onBack={onBack} backLabel={backLabel} onLogout={onLogout}/>
    <div className="workspace-body"><div className="workspace-scroll"><main className="workspace-main" id="main-content">
      <div className="workspace-location"><span>FABRICCOST / WORKSPACE</span><span>Made for the loom floor <b>↗</b></span></div>
      <header className="page-heading"><div>{eyebrow?<Eyebrow>{eyebrow}</Eyebrow>:null}{title?<h1 className="font-display">{title}</h1>:null}</div>{subtitle?<p>{subtitle}</p>:null}</header>
      <div className="workspace-content">{children}</div><Footer className="mt-10 pt-5"/>
    </main></div></div>{stickyFooter}
  </div>
}
