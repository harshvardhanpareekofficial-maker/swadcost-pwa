import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
interface InstallEvent extends Event { prompt:()=>Promise<void>; userChoice:Promise<{outcome:string}> }
export function InstallButton() {
  const [prompt,setPrompt]=useState<InstallEvent|null>(null)
  const [help,setHelp]=useState(false)
  useEffect(()=>{const listener=(e:Event)=>{e.preventDefault();setPrompt(e as InstallEvent)}; window.addEventListener('beforeinstallprompt',listener); return ()=>window.removeEventListener('beforeinstallprompt',listener)},[])
  if(Capacitor.isNativePlatform()||window.matchMedia('(display-mode: standalone)').matches) return null
  return <div className="install-wrap"><button className="install-button" onClick={async()=>{if(prompt){await prompt.prompt();await prompt.userChoice;setPrompt(null)}else setHelp(!help)}}>Install app <span aria-hidden>↗</span></button>{help?<div className="install-help" role="status">On Android, open your browser menu and choose <strong>Install app</strong>. On iPhone, use <strong>Share → Add to Home Screen</strong>.<button onClick={()=>setHelp(false)} aria-label="Close install instructions">×</button></div>:null}</div>
}
