import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ToolFrame } from './ToolsPage'
import { PageControls } from '../components/PageControls'
import { GUIDE_PAGES, guideBySlug } from '../lib/guides'
export function GuidePage() {
 const {slug}=useParams<{slug:string}>()
 const guide=guideBySlug(slug)
 return <ToolFrame>{guide?<GuideContent key={slug} guide={guide}/>:<main id="tool-content" className="guide-screen"><h1>Guide not found.</h1><Link to="/calculator">Open calculator ↗</Link><nav>{GUIDE_PAGES.map(g=><Link key={g.slug} to={g.path}>{g.navLabel}</Link>)}</nav></main>}</ToolFrame>
}
function GuideContent({guide}:{guide:NonNullable<ReturnType<typeof guideBySlug>>}) {
 const [page,setPage]=useState(0)
 const pages=guide.sections.flatMap(section=>section.paragraphs.map(text=>({heading:section.heading,text})))
 const current=pages[page]
 return <main id="tool-content" className="guide-screen"><p className="tool-eyebrow">CALCULATOR GUIDE</p><h1>{guide.navLabel}</h1><article><h2>{current.heading}</h2><p>{current.text}</p></article><PageControls page={page} count={pages.length} onChange={setPage}/><nav className="guide-navigation"><Link to="/calculator">Open calculator ↗</Link><select aria-label="Other guides" value={guide.path} onChange={e=>window.location.assign(e.target.value)}>{GUIDE_PAGES.map(g=><option key={g.slug} value={g.path}>{g.navLabel}</option>)}</select></nav></main>
}
