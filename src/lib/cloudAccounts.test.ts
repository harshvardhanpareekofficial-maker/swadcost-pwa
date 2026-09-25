import {beforeEach,describe,expect,it,vi} from 'vitest'
import {gateway} from './gateway'
import {lookupCloudAccount,upsertCloudAccount,CLOUD_UNAVAILABLE} from './cloudAccounts'
vi.mock('./gateway',()=>({gateway:vi.fn()}))
vi.mock('./supabase',()=>({getSupabase:()=>({})}))
beforeEach(()=>vi.resetAllMocks())
describe('Private account lookup through the gateway',()=>{
 it('normalizes IDs before lookup',async()=>{vi.mocked(gateway).mockResolvedValue({status:'found',username:'Harshvardhan',usernameNorm:'harshvardhan'});expect(await lookupCloudAccount(' HARSHVARDHAN ')).toMatchObject({status:'found'});expect(gateway).toHaveBeenCalledWith({action:'lookup',username:'harshvardhan'})})
 it('distinguishes network failure from a missing account',async()=>{vi.mocked(gateway).mockRejectedValue(new Error('offline'));expect(await lookupCloudAccount('somebody')).toEqual({status:'unavailable',error:CLOUD_UNAVAILABLE})})
 it('returns missing only after successful lookup',async()=>{vi.mocked(gateway).mockResolvedValue({status:'missing'});expect(await lookupCloudAccount('new-user')).toEqual({status:'missing'})})
 it('sends metadata without passwords',async()=>{vi.mocked(gateway).mockResolvedValue({ok:true});expect(await upsertCloudAccount('Harsh')).toEqual({ok:true});expect(gateway).toHaveBeenCalledWith({action:'activity',username:'Harsh'})})
})
