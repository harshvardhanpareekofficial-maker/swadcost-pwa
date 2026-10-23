// Development-only visual fixture. Not a Vite build entry. No login, telemetry or account writes.
import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {MemoryRouter} from 'react-router-dom'
import '@fontsource-variable/archivo'
import '../src/index.css'
import '../src/pages/tools.css'
import '../src/screen.css'
import {HomePage} from '../src/pages/HomePage'
import {InputMethodPage} from '../src/pages/InputMethodPage'
import {CalculatorPage} from '../src/pages/CalculatorPage'
import {ResultsPage} from '../src/pages/ResultsPage'
import {SAMPLE_SINGLE,SAMPLE_MULTI,calculateSingle,calculateMulti} from '../src/lib/costing'
import type {CostMode,InputMethod} from '../src/lib/types'
export function Check(){
 const[screen,setScreen]=useState('home'),[mode,setMode]=useState<CostMode>('single'),[method,setMethod]=useState<InputMethod>('type'),[name,setName]=useState(''),[single,setSingle]=useState({...SAMPLE_SINGLE}),[multi,setMulti]=useState({...SAMPLE_MULTI})
 const home=()=>setScreen('home'),calc=()=>setScreen('calc')
 if(screen==='home')return <HomePage fabricName={name} onFabricName={setName} onChooseMode={m=>{setMode(m);setScreen('method')}} onLogout={home}/>
 if(screen==='method')return <InputMethodPage fabricName={name} modeLabel={mode} onChoose={m=>{setMethod(m);calc()}} onBack={home} onLogout={home}/>
 if(screen==='calc')return <CalculatorPage fabricName={name} mode={mode} inputMethod={method} single={single} multi={multi} onChangeSingle={setSingle} onChangeMulti={setMulti} onCalculate={()=>setScreen('results')} onBack={()=>setScreen('method')} onLogout={home}/>
 return <ResultsPage fabricName={name} mode={mode} single={single} multi={multi} result={mode==='single'?calculateSingle(single):calculateMulti(multi)} onChangeSingle={setSingle} onChangeMulti={setMulti} onResult={()=>{}} onHome={home} onBackEdit={calc} onLogout={home}/>
}
createRoot(document.getElementById('root')!).render(<MemoryRouter><Check/></MemoryRouter>)
