// @vitest-environment jsdom
import {act,useState} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {CalculatorPage} from './CalculatorPage'
import {ResultsPage} from './ResultsPage'
import {SAMPLE_SINGLE,SAMPLE_MULTI,calculateMulti,calculateSingle} from '../lib/costing'
import type {CostMode} from '../lib/types'
vi.mock('../hooks/useSpeechFill',()=>({useSpeechFill:()=>({supported:false,listening:false,start:vi.fn(),stop:vi.fn()})}))
vi.mock('../components/StudioBar',()=>({StudioBar:()=>null}))
let host:HTMLDivElement,root:Root
beforeEach(()=>{host=document.createElement('div');document.body.append(host);root=createRoot(host)})
afterEach(async()=>{await act(()=>root.unmount());host.remove()})
const button=(name:string)=>[...host.querySelectorAll('button')].find(b=>b.textContent===name)!
async function click(name:string){await act(()=>button(name).click())}
function Sheet({mode}:{mode:CostMode}){const[single,setSingle]=useState({...SAMPLE_SINGLE}),[multi,setMulti]=useState({...SAMPLE_MULTI});return <CalculatorPage fabricName="Test sheet" mode={mode} inputMethod="type" single={single} multi={multi} onChangeSingle={setSingle} onChangeMulti={setMulti} onCalculate={()=>{}} onBack={()=>{}} onLogout={()=>{}}/>}
describe('paged calculator completeness',()=>{
 for(const[mode,count] of [['single',13],['multi',29]] as const){it(`${mode}: every field is reachable and edits survive navigation`,async()=>{
  await act(()=>root.render(<MemoryRouter><Sheet mode={mode}/></MemoryRouter>))
  const input=host.querySelector('input')!;await act(()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,'125');input.dispatchEvent(new Event('input',{bubbles:true}))})
  const ids=new Set<string>();for(let n=0;n<10;n++){host.querySelectorAll('input').forEach(e=>ids.add(e.id));if(button('Calculate'))break;await click('Continue →')}
  expect(ids.size).toBe(count);expect(ids.has('pickRate')).toBe(true);expect(ids.has('warping')).toBe(true)
  while(!button('← Previous').disabled)await click('← Previous')
  expect(host.querySelector<HTMLInputElement>('#reed')!.value).toBe('125')
 })}
 it('all yarns and markups remain in print output while the display is paged',async()=>{
  const result=calculateMulti(SAMPLE_MULTI);await act(()=>root.render(<MemoryRouter><ResultsPage fabricName="Test" mode="multi" single={SAMPLE_SINGLE} multi={SAMPLE_MULTI} result={result} onChangeSingle={()=>{}} onChangeMulti={()=>{}} onResult={()=>{}} onHome={()=>{}} onBackEdit={()=>{}} onLogout={()=>{}}/></MemoryRouter>))
  const printed=host.querySelector('.print-cost-sheet')!.textContent!;for(const yarn of [...result.warpLines,...result.weftLines])expect(printed).toContain(yarn.label)
  expect(printed).toContain('+16%');expect(host.querySelector('.result-page')!.textContent).not.toContain('+16%')
  for(let i=0;i<10&&!button('Next →').disabled;i++)await click('Next →')
  expect(host.querySelector('.result-page')!.textContent).toContain('+16%');expect(calculateSingle(SAMPLE_SINGLE).grandTotal.toFixed(2)).toBe('59.40')
 })
})
