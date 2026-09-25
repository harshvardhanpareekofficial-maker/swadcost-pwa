import { gateway } from './gateway'
import type { CalcEvent } from './telemetry'
const KEY='fabriccost.pending-calculations.v1'
function read():CalcEvent[] {try{const rows=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(rows)?rows:[]}catch{return []}}
function write(rows:CalcEvent[]) {localStorage.setItem(KEY,JSON.stringify(rows));window.dispatchEvent(new Event('fabriccost-sync'))}
let running=false
export function pendingCount(){return read().length}
export function queueCalculation(row:CalcEvent){const rows=read();if(!rows.some(r=>r.id===row.id))write([...rows,row]);void flushPending()}
export async function flushPending(){
 if(running||!navigator.onLine)return
 running=true
 try{for(const row of read()){
   await gateway({action:'record',username:row.username,event:row})
   write(read().filter(r=>r.id!==row.id))
 }}catch{/* Keep unsent records for the next online attempt. */}finally{running=false}
}
