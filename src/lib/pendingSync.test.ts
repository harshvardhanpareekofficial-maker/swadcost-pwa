// @vitest-environment jsdom
import {beforeEach,describe,it,expect,vi} from 'vitest'
import {gateway} from './gateway'
import {queueCalculation,pendingCount,flushPending} from './pendingSync'
import type {CalcEvent} from './telemetry'
vi.mock('./gateway',()=>({gateway:vi.fn()}))
const row={id:'0a315f84-31a1-4cec-9998-7deac67da49b',username:'QA',fabricName:'Cotton',mode:'single',reed:120,pick:68,warpRs:65,qualityLabel:'120×68',finalCost:59.4,payload:{},createdAt:'2026-09-25T12:00:00Z'} satisfies CalcEvent
beforeEach(()=>{localStorage.clear();vi.resetAllMocks();Object.defineProperty(navigator,'onLine',{value:false,configurable:true})})
describe('Offline record delivery',()=>{
 it('retains offline records and sends a stable id only once',async()=>{queueCalculation(row);queueCalculation(row);expect(pendingCount()).toBe(1);expect(gateway).not.toHaveBeenCalled();Object.defineProperty(navigator,'onLine',{value:true,configurable:true});vi.mocked(gateway).mockResolvedValue({ok:true});await flushPending();expect(pendingCount()).toBe(0);expect(gateway).toHaveBeenCalledTimes(1);expect(gateway).toHaveBeenCalledWith({action:'record',username:'QA',event:row})})
 it('retains a failed request for retry',async()=>{queueCalculation(row);Object.defineProperty(navigator,'onLine',{value:true,configurable:true});vi.mocked(gateway).mockRejectedValue(new Error('offline'));await flushPending();expect(pendingCount()).toBe(1)})
})
