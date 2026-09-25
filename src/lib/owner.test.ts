// @vitest-environment jsdom
import {beforeEach,describe,expect,it,vi} from 'vitest'
import {gateway} from './gateway'
import {checkOwnerPin,isOwnerUnlocked,lockOwner,ownerCredential,unlockOwner,OWNER_PATH} from './owner'
vi.mock('./gateway',()=>({gateway:vi.fn()}))
beforeEach(()=>{lockOwner();vi.resetAllMocks();vi.useRealTimers()})
describe('Server-authorized owner ledger',()=>{
 it('has a separate unlinked path',()=>expect(OWNER_PATH).toMatch(/^\/owner-vault-[a-f0-9]{24}$/))
 it('does not trust a browser unlock flag',()=>{sessionStorage.setItem('fabriccost.owner','1');unlockOwner();expect(isOwnerUnlocked()).toBe(false);expect(()=>ownerCredential()).toThrow()})
 it('rejects a server-denied password',async()=>{vi.mocked(gateway).mockRejectedValue(new Error('Unauthorized'));await expect(checkOwnerPin('wrong')).rejects.toThrow();expect(isOwnerUnlocked()).toBe(false)})
 it('expires access and clears credentials when locked',async()=>{vi.useFakeTimers();vi.mocked(gateway).mockResolvedValue({});await checkOwnerPin('test-only');expect(isOwnerUnlocked()).toBe(true);vi.advanceTimersByTime(15*60*1000+1);expect(isOwnerUnlocked()).toBe(false);expect(()=>ownerCredential()).toThrow();lockOwner();expect(isOwnerUnlocked()).toBe(false)})
})
