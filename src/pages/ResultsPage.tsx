import { useState } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { Layout } from '../components/Layout'
import { PageControls } from '../components/PageControls'
import { formatInr, type CostBreakdown, type MultiInputs, type SingleInputs } from '../lib/costing'
import type { CostMode } from '../lib/types'
import { DALAL_COST_LINE_LABEL } from '../lib/labels'
type Props = {
  fabricName: string
  mode: CostMode
  single: SingleInputs
  multi: MultiInputs
  result: CostBreakdown
  onChangeSingle: (s: SingleInputs) => void
  onChangeMulti: (m: MultiInputs) => void
  onResult: (r: CostBreakdown) => void
  onHome: () => void
  onBackEdit: () => void
  onLogout: () => void
}

export function ResultsPage({fabricName,result,onHome,onBackEdit,onLogout}:Props) {
 const [page,setPage]=useState(0),[error,setError]=useState('')
 const summary=[['Total ends',String(result.totalEnds)],['Warp weight',String(result.warpWeight)],['Weft weight (base)',String(result.weftWeightBase)],['Weft with wastage',String(result.weftWeight)],['Warp cost',formatInr(result.warpCostRaw)],['Weft cost',formatInr(result.weftCostRaw)],['Sizing',formatInr(result.sizingCost)],[DALAL_COST_LINE_LABEL,formatInr(result.jobCost)],['Warping',formatInr(result.warping)]]
 const yarns=[...result.warpLines,...result.weftLines].map(l=>[`${l.label} · ${l.pct}% · Ne ${l.count}`,`${formatInr(l.yarnCostRaw)} · wt ${l.weight} · rate ${l.rate}${l.sizingCost!=null?' · sizing '+formatInr(l.sizingCost):''}`])
 const markups=result.markups.map(m=>[`+${m.pct}%`,formatInr(m.amount)])
 const pages=[{title:'Construction',rows:summary.slice(0,4)},{title:'Costs',rows:summary.slice(4)},...Array.from({length:Math.max(1,Math.ceil(yarns.length/3))},(_,i)=>({title:'Yarn details',rows:yarns.slice(i*3,i*3+3)})),...Array.from({length:Math.ceil(markups.length/6)},(_,i)=>({title:'Markups',rows:markups.slice(i*6,i*6+6)}))]
 const current=pages[Math.min(page,pages.length-1)]
 return <Layout title="Cost sheet." subtitle={fabricName || 'Untitled'} onBack={onBackEdit} onLogout={onLogout}>
 <div className="result-total"><span>FINAL COST</span><strong>{formatInr(result.grandTotal)}</strong>{result.length>0&&<small>Total ÷ L2L: {formatInr(result.costPerUnitLength)}</small>}</div>
 <section className="result-page"><h2>{current.title}</h2><dl>{current.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
 <PageControls page={page} count={pages.length} onChange={setPage}/>
 {error&&<p role="alert">{error}</p>}
 <div className="result-buttons"><button onClick={onBackEdit}>Edit inputs</button><button onClick={onHome}>New costing</button><button onClick={async()=>{try{if(Capacitor.isNativePlatform())await registerPlugin<{print:()=>Promise<void>}>('StudioPrint').print();else window.print()}catch{setError('Could not open print. Please retry.')}}}>Print / PDF ↗</button></div>
 <div className="print-cost-sheet">{pages.map((part,i)=><section key={i}><h2>{part.title}</h2><dl>{part.rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</div>
 </Layout>
}
