import { Link, NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import './tools.css'

export function ToolFrame({ children }: { children: ReactNode }) {
  return <div className="tool-site">
    <a className="tool-skip" href="#tool-content">Skip to content</a>
    <header className="tool-header">
      <Link className="tool-brand" to="/" aria-label="Harshvardhan Pareek — all tools"><span className="tool-monogram" aria-hidden>hp.</span><span>Harshvardhan Pareek<small>TOOLS FOR THE FACTORY FLOOR</small></span></Link>
      <nav aria-label="Products"><NavLink to="/cctv-counter">CCTV Counter</NavLink><NavLink to="/calculator">Calculator</NavLink></nav>
    </header>
    {children}
    <footer className="tool-footer"><span>Made by Harshvardhan Pareek</span><span>Ichalkaranji, India</span><Link to="/">All tools ↗</Link></footer>
  </div>
}

export function CounterDrawing() {
  return <svg viewBox="0 0 440 220" className="tool-drawing" fill="none" aria-hidden>
    <path d="M35 178H405M72 178V90H358V178M72 90L95 62H335L358 90" stroke="currentColor" strokeWidth="2" opacity=".28"/>
    <path d="M95 62V36H127L153 52L143 70L115 55H95M137 63L264 135" stroke="currentColor" strokeWidth="2"/>
    <path d="M202 104V184" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" opacity=".65"/>
    <path d="M112 139L139 124L165 139V170L139 184L112 170ZM112 139L139 154L165 139M139 154V184" stroke="currentColor" strokeWidth="2"/>
    <path d="M254 122L282 107L310 122V155L282 170L254 155ZM254 122L282 137L310 122M282 137V170" stroke="currentColor" strokeWidth="2"/>
    <path d="M244 102V93H257M307 93H320V106M244 166V179H257M307 179H320V166" stroke="currentColor" strokeWidth="2"/>
    <path d="M177 142H224L216 134M224 142L216 150" stroke="currentColor" strokeWidth="2"/>
  </svg>
}

function FabricDrawing() {
  return <svg viewBox="0 0 440 220" className="tool-drawing" fill="none" aria-hidden>
    <path d="M80 45H330V185H80Z" stroke="currentColor" strokeWidth="2" opacity=".4"/>
    {Array.from({ length: 12 }, (_, i) => <path key={'v'+i} d={`M${94+i*20} 30V200`} stroke="currentColor" strokeWidth={i%3===0 ? 5 : 1.5} opacity={i%3===0 ? .3 : .5}/>)}
    {Array.from({ length: 7 }, (_, i) => <path key={'h'+i} d={`M65 ${55+i*20}H345`} stroke="currentColor" strokeWidth={i%3===0 ? 5 : 1.5} opacity={i%3===0 ? .3 : .5}/>)}
    <path d="M354 45H374V185H354M364 65H374M359 85H374M364 105H374M359 125H374M364 145H374M359 165H374" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
}

export function ToolsPage() {
  return <ToolFrame><main id="tool-content" className="tools-main">
    <div className="tools-intro"><p className="tool-eyebrow">THE WORK. A LITTLE SIMPLER.</p><h1>Two tools.<br/><span>Your factory.</span></h1><p>Choose what you’re working on.<br/>From the cost sheet to the dispatch gate.</p></div>
    <div className="tool-choices">
      <Link to="/cctv-counter" className="tool-choice counter-choice"><div className="tool-card-top"><span>GATE DESK</span><span className="tool-tag">In development</span></div><CounterDrawing/><div className="tool-card-copy"><h2>CCTV Counter</h2><p>Bring gate passes and camera evidence together. Get the desktop setup and follow the factory pilot.</p><span className="tool-card-action">View desktop downloads <span aria-hidden>↗</span></span></div><div className="tool-card-bottom"><span>Windows</span><span>Mac · Apple silicon</span></div></Link>
      <Link to="/calculator" className="tool-choice calculator-choice"><div className="tool-card-top"><span>FABRICCOST STUDIO</span><span className="tool-tag">Open in your browser</span></div><FabricDrawing/><div className="tool-card-copy"><h2>Calculator</h2><p>Turn warp, weft and mill-sheet values into a clear fabric cost. Speak or type your inputs.</p><span className="tool-card-action">Open fabric calculator <span aria-hidden>↗</span></span></div><div className="tool-card-bottom"><span>Single & multiple yarns</span><span>Phone & desktop</span></div></Link>
    </div>
    <p className="tools-footnote">Built around the everyday work of textile mills.</p>
  </main></ToolFrame>
}
