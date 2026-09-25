import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

// Replaced during provisioning. Only a high-entropy password digest is deployed.
const OWNER_SHA256 = '6f1a9ff2a413b299326a3f294df1ad77d4edbca81ea16bb8de588b3e22230133'
const allowed = new Set(['https://harshvardhanpareek.com', 'https://www.harshvardhanpareek.com', 'http://localhost:5173', 'http://localhost:4173', 'https://localhost'])
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })
const hash = async (s: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))).map(b=>b.toString(16).padStart(2,'0')).join('')
function equal(a: string,b: string) { let d=a.length^b.length; for(let i=0;i<Math.max(a.length,b.length);i++) d|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0); return d===0 }

Deno.serve(async req => {
  const origin=req.headers.get('origin')||''
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://harshvardhanpareek.com','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info, x-owner-gate','Access-Control-Allow-Methods':'POST, OPTIONS'}
  const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers})
  if(origin&&!allowed.has(origin)) return reply({error:'Origin not allowed'},403)
  if(req.method==='OPTIONS') return new Response(null,{status:204,headers})
  if(req.method!=='POST') return reply({error:'POST required'},405)
  try {
    const raw=await req.text(); if(raw.length>32768) return reply({error:'Request too large'},413)
    const body=JSON.parse(raw)
    const action=body.action
    if(!['lookup','activity','record','owner'].includes(action)) return reply({error:'Unknown action'},400)
    const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'
    const bucket=await hash(`${ip}:${action}:${Math.floor(Date.now()/60000)}`)
    const rate=await db.rpc('fabriccost_rate_hit',{bucket_key:bucket})
    if(rate.error) return reply({error:'Service unavailable'},503)
    if(Number(rate.data)>(action==='owner'?12:120)) return reply({error:'Too many attempts. Try again in a minute.'},429)
    if(action==='owner') {
      const pass=req.headers.get('x-owner-gate')||''
      if(!pass || !equal(await hash(pass),OWNER_SHA256)) return reply({error:'Incorrect owner password'},401)
      // Page through records; never silently rank only the first 500 calculations.
      const accounts:unknown[]=[],calcs:unknown[]=[]
      for(const [table,select,out] of [
        ['swadcost_accounts','id,username,created_at,last_active_at',accounts],
        ['swadcost_calcs','id,username,fabric_name,mode,reed,pick,warp_rs,quality_label,final_cost,payload,created_at',calcs],
      ] as const) {
        for(let start=0;;start+=1000) {
          const {data,error}=await db.from(table).select(select).order('created_at',{ascending:false}).order('id').range(start,start+999)
          if(error) throw error
          out.push(...(data||[])); if((data?.length||0)<1000) break
        }
      }
      return reply({accounts,calcs,source:'supabase'})
    }
    const username=typeof body.username==='string'?body.username.trim():''
    if(!username||username.length>100||username.toLowerCase()==='guest') return reply({error:'Enter a valid user ID'},400)
    if(action==='lookup') {
      const {data,error}=await db.from('swadcost_accounts').select('username').eq('username_norm',username.toLowerCase()).maybeSingle()
      if(error) throw error
      return reply(data?{status:'found',username:data.username,usernameNorm:username.toLowerCase()}:{status:'missing'})
    }
    if(action==='activity') {
      const {error}=await db.from('swadcost_accounts').upsert({username,last_active_at:new Date().toISOString()},{onConflict:'username_norm'})
      if(error) throw error
      return reply({ok:true})
    }
    const row=body.event
    if(!row||!['single','multi'].includes(row.mode)||!(/^[0-9a-f-]{36}$/i.test(row.id||''))) return reply({error:'Invalid calculation'},400)
    for(const k of ['reed','pick','warpRs','finalCost']) if(!Number.isFinite(row[k])||row[k]<0||row[k]>1e9) return reply({error:'Invalid calculation value'},400)
    const {error}=await db.from('swadcost_calcs').upsert({id:row.id,username,fabric_name:String(row.fabricName||'Untitled fabric').slice(0,100),mode:row.mode,reed:row.reed,pick:row.pick,warp_rs:row.warpRs,quality_label:`${row.reed}Ã—${row.pick}`,final_cost:row.finalCost,payload:row.payload&&typeof row.payload==='object'?row.payload:{},created_at:new Date().toISOString()},{onConflict:'id',ignoreDuplicates:true})
    if(error) throw error
    return reply({ok:true})
  } catch { return reply({error:'The studio could not complete this request. Please retry.'},500) }
})
