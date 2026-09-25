import { getSupabase } from './supabase'

export async function gateway<T>(body: Record<string, unknown>, gate?: string): Promise<T> {
  const client=getSupabase()
  if(!client) throw new Error('Studio connection is not configured. Please refresh after an update.')
  const {data,error}=await client.functions.invoke('fabriccost-gateway',{body,headers:gate?{'x-owner-gate':gate}:undefined})
  if(error) {
    const status=(error as {context?:Response}).context?.status
    throw new Error(status===401?'That owner password is not correct.':status===429?'Too many attempts. Wait a minute and try again.':'Studio connection unavailable. Check your connection and retry.')
  }
  if(data?.error) throw new Error(data.error)
  return data as T
}
