import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { Eyebrow } from './SectionLabel'
import { StudioBar } from './StudioBar'
import { WeaveGraphic } from './WeaveGraphic'
type Props={children:ReactNode;eyebrow?:string;title?:string;subtitle?:string;onLogout?:()=>void;onBack?:()=>void;backLabel?:string;stickyFooter?:ReactNode}
export function Layout({children,eyebrow,title,subtitle,onLogout,onBack,backLabel,stickyFooter}:Props) {
  return <div className="studio-atmosphere workspace-shell text-ink">
    <StudioBar onBack={onBack} backLabel={backLabel} onLogout={onLogout}/>
    <div className="workspace-body">
      <aside className="workspace-rail" aria-label="About your costing workspace">
        <div><span className="rail-caption">THE MILL WORKSPACE</span><h2>Good fabric.<br/>Clear numbers.</h2><p>From the first thread to the final quote. Your mill sheet, with every cost accounted for.</p></div>
        <WeaveGraphic compact className="rail-weave"/>
        <dl className="rail-notes"><div><dt>01 / CONSTRUCTION</dt><dd>Reed, pick & yarn counts</dd></div><div><dt>02 / CONVERSION</dt><dd>Yarn, sizing & making</dd></div><div><dt>03 / COST SHEET</dt><dd>A clear price to work with</dd></div></dl>
        <p className="rail-bottom">DESIGNED FOR THE LOOM FLOOR<br/><strong>Ichalkaranji, India</strong></p>
      </aside>
      <div className="workspace-scroll"><main className="workspace-main" id="main-content">
        <header className="page-heading">{eyebrow?<Eyebrow>{eyebrow}</Eyebrow>:null}{title?<h1 className="font-display">{title}</h1>:null}{subtitle?<p>{subtitle}</p>:null}</header>
        <div className="workspace-content">{children}</div><Footer className="mt-10 pt-5"/>
      </main></div>
    </div>{stickyFooter}
  </div>
}
