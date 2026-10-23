import { Link, NavLink } from 'react-router-dom'
import { lazy, Suspense, useState, type ReactNode } from 'react'
import { FabricStage } from '../components/FabricStage'
import './tools.css'
const CameraScene = lazy(() => import('../components/CameraScene'))
export function ToolFrame({ children }: { children: ReactNode }) {
 return <div className="tool-site"><a className="tool-skip" href="#tool-content">Skip to content</a><header className="tool-header"><Link className="tool-brand" to="/" aria-label="Harshvardhan Pareek — all tools"><span className="tool-monogram">hp.</span><span>Harshvardhan<br/>Pareek</span></Link><nav aria-label="Products"><NavLink to="/cctv-counter">CCTV Counter</NavLink><NavLink to="/calculator">Calculator ↗</NavLink></nav></header>{children}<footer className="tool-footer"><span>Factory tools / Ichalkaranji</span><Link to="/">Harshvardhan Pareek</Link></footer></div>
}
export function ToolsPage() {
 const [active,setActive]=useState<'counter'|'calculator'>('counter')
 const counter=active==='counter'
 return <ToolFrame><main id="tool-content" className={`product-stage ${counter?'is-counter':'is-fabric'}`}>
 <div className="stage-kicker"><span>01 — FACTORY SOFTWARE</span><span>{counter?'DESKTOP PREVIEW':'BROWSER APP'}</span></div>
 <h1 className="stage-wordmark" aria-label={counter?'CCTV Counter':'Fabric Calculator'}>{counter?<>GATE<span>DESK</span></>:<>FABRIC<span>COST</span></>}</h1>
 <div className="stage-object" key={active}>{counter?<Suspense fallback={<span className="scene-loading">CCTV Counter</span>}><CameraScene/></Suspense>:<FabricStage/>}</div>
 <div className="stage-bottom"><div className="stage-copy"><p>{counter?'Gate passes. Camera records.':'Warp, weft, and yarn costs.'}</p><Link className="stage-cta" to={counter?'/cctv-counter':'/calculator'}>{counter?'Desktop downloads':'Open calculator'} <span>↗</span></Link></div>
 <div className="product-switch" aria-label="Choose a tool"><button aria-pressed={counter} onClick={()=>setActive('counter')}><small>01</small>CCTV Counter</button><button aria-pressed={!counter} onClick={()=>setActive('calculator')}><small>02</small>Calculator</button></div></div>
 </main></ToolFrame>
}
