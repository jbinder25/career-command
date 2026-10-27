// Site-wide gate. Every request except /login and the cron-authenticated
// /api/job-scan needs a valid Supabase session
// for an allowed email. The login page stores the access token in the jic_at
// cookie; this checks it against Supabase Auth before anything is served.
import CONFIG from './public/shared/config.js';
const SUPABASE_URL=CONFIG.supabaseUrl;
const SUPABASE_KEY=CONFIG.supabaseKey;
const ALLOWED_EMAILS=CONFIG.ownerEmails.map(e=>e.toLowerCase());
const COOKIE='jic_at';

export const config={matcher:['/((?!login(?:/|$)|favicon\\.(?:ico|svg)$|shared/theme\\.js$|shared/config\\.js$|api/job-scan$).*)']};

const verified=new Map();

function readCookie(request,name){
 const header=request.headers.get('cookie')||'';
 for(const part of header.split(/;\s*/)){const i=part.indexOf('=');if(i>0&&part.slice(0,i)===name)return decodeURIComponent(part.slice(i+1))}
 return null;
}

function tokenExpiry(token){
 try{
  let b64=token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
  b64+='='.repeat((4-b64.length%4)%4);
  return (JSON.parse(atob(b64)).exp||0)*1000;
 }catch{return 0}
}

// Returns null when allowed, otherwise a short reason the login page can show.
async function check(token){
 if(!token)return 'no_cookie';
 const exp=tokenExpiry(token);
 if(!exp)return 'bad_token';
 if(exp<=Date.now())return 'expired';
 const cached=verified.get(token);
 if(cached&&cached>Date.now())return null;
 let res;
 try{res=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token}})}catch{return 'verify_unreachable'}
 if(!res.ok)return 'verify_'+res.status;
 const user=await res.json().catch(()=>null);
 if(!ALLOWED_EMAILS.includes(String(user?.email||'').toLowerCase()))return 'email_not_allowed';
 if(verified.size>200)verified.clear();
 verified.set(token,Math.min(exp,Date.now()+5*60*1000));
 return null;
}

export default async function middleware(request){
 const reason=await check(readCookie(request,COOKIE)).catch(()=>'error');
 if(!reason)return;
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/'))return new Response(JSON.stringify({error:'Sign in required'}),{status:401,headers:{'content-type':'application/json','cache-control':'no-store'}});
 const login=new URL('/login',url);
 login.searchParams.set('next',url.pathname+url.search);
 login.searchParams.set('reason',reason);
 return new Response(null,{status:307,headers:{Location:login.toString(),'cache-control':'no-store'}});
}
