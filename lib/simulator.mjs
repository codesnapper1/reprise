// Discrete-event payment simulator. All amounts are integer paise; time is virtual.
export const families = ['late_capture','duplicate_webhook','consent_revoked','budget_race','refund_replay','clean_control'];
export const familyNames = {late_capture:'Late confirmation',duplicate_webhook:'Repeated webhook',consent_revoked:'Consent withdrawn',budget_race:'Concurrent spending',refund_replay:'Refund replay',clean_control:'Clean recovery'};
export const checks = {double_charge:'One purchase, one charge',consent:'Consent before action',budget:'Spend within the mandate',refund:'Refund within captured funds',progress:'Valid recovery completes'};
export function random(seed){let t=seed>>>0; return ()=>{t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
export function scenario(seed,family){const r=random(seed);const amount=(500+Math.floor(r()*9500))*100;return {id:`case-${seed}`,seed,family:family??families[Math.floor(r()*families.length)],amount,delay:2+Math.floor(r()*14),retryAt:3+Math.floor(r()*9),copies:1+Math.floor(r()*4),revokeAt:2+Math.floor(r()*12),budget:Math.round(amount*(1.05+r()*.6)),noise:Math.floor(r()*6)};}
export function makeEvents(s){let es=[];let seq=0;const add=(at,type,extra={})=>es.push({at,type,id:`evt-${seq++}`,intent:'A',...extra});
 add(0,'checkout.failed');
 if(s.family==='late_capture'){add(s.delay,'gateway.captured');add(s.delay+5,'webhook.captured');add(s.retryAt,'recovery.request');}
 if(s.family==='duplicate_webhook'){add(1,'gateway.failed');for(let i=0;i<s.copies;i++)add(s.retryAt+i,'recovery.request',{id:'evt-redelivery'});}
 if(s.family==='consent_revoked'){add(1,'gateway.failed');add(s.revokeAt,'consent.revoked');add(s.retryAt,'recovery.request');}
 if(s.family==='budget_race'){add(1,'gateway.failed');add(1,'gateway.failed',{intent:'B'});add(s.retryAt,'recovery.request',{snapshot:0});add(s.retryAt,'recovery.request',{intent:'B',snapshot:0});}
 if(s.family==='refund_replay'){add(1,'gateway.captured');add(2,'webhook.captured');for(let i=0;i<s.copies;i++)add(s.retryAt+i,'refund.request',{id:'evt-refund'});}
 if(s.family==='clean_control'){add(1,'gateway.failed');add(s.retryAt,'recovery.request');}
 for(let i=0;i<s.noise;i++)add(i*2+.5,'telemetry.heartbeat');
 return es.sort((a,b)=>a.at-b.at||Number(a.id.split('-')[1]??0)-Number(b.id.split('-')[1]??0));
}
export function run(s,guarded=false,events=makeEvents(s),overrides={},decisions={}){
 const guard={settlement:guarded,idempotency:guarded,consent:guarded,budget:guarded,refund:guarded,...overrides};
 const state={captured:{A:0,B:0},observed:{A:0,B:0},terminal:{A:false,B:false},refunded:{A:0,B:0},consent:true,spent:0};
 const seen=new Set();const violations=[];const steps=[];let recovered=0,blocked=0;
 const flag=(code,event,amount)=>{if(!violations.some(v=>v.code===code))violations.push({code,label:checks[code],at:event.at,eventId:event.id,exposure:amount});};
 for(const [eventIndex,event] of events.entries()){const e=event;const k=e.intent??'A';let action='observe',reason='State recorded';
 if(e.type==='gateway.captured'){state.captured[k]+=s.amount;state.terminal[k]=true;reason='Gateway confirms original payment';}
 if(e.type==='gateway.failed'){state.terminal[k]=true;reason='Original attempt is terminal and unpaid';}
 if(e.type==='webhook.captured'){state.observed[k]=s.amount;reason='Merchant receives capture confirmation';}
 if(e.type==='consent.revoked'){state.consent=false;reason='Customer withdraws recovery permission';}
 if(e.type==='recovery.request'){
  let stop='';if(decisions[eventIndex]==='hold')stop='Agent chose to hold this action';
  else if(guard.idempotency&&seen.has(e.id))stop='Event already processed';
  else if(guard.consent&&!state.consent)stop='Recovery permission was withdrawn';
  else if(guard.settlement&&!state.terminal[k])stop='Original payment is unresolved; wait for final status';
  else if((guard.settlement?state.captured[k]:state.observed[k])>=s.amount)stop='Purchase already paid';
  else if((guard.budget?state.spent:(e.snapshot??state.spent))+s.amount>s.budget)stop='Mandate budget would be exceeded';
  if(stop){action='hold';reason=stop;blocked++;}else{action='recover';reason='Recovery completes in the simulated gateway';state.captured[k]+=s.amount;state.spent+=s.amount;recovered+=s.amount;if(!state.consent)flag('consent',e,s.amount);}
 }
 if(e.type==='refund.request'){
  if(decisions[eventIndex]==='hold'||(guard.idempotency&&seen.has(e.id))||(guard.refund&&state.refunded[k]+s.amount>state.captured[k])){action='hold';reason='Refund already applied; no refundable balance';blocked++;}
  else{action='refund';reason='Refund posts to the simulated ledger';state.refunded[k]+=s.amount;}
 }
 seen.add(e.id);
 if(state.captured[k]>s.amount)flag('double_charge',e,state.captured[k]-s.amount);
 if(state.spent>s.budget)flag('budget',e,state.spent-s.budget);
 if(state.refunded[k]>state.captured[k])flag('refund',e,state.refunded[k]-state.captured[k]);
 steps.push({...e,action,reason,ledger:JSON.parse(JSON.stringify(state)),violations:violations.map(v=>v.code)});
 }
 // Liveness prevents an implementation that blocks everything from appearing correct.
 if(s.family==='clean_control'&&events.some(e=>e.type==='recovery.request')&&state.captured.A<s.amount)flag('progress',{at:s.retryAt,id:'liveness'},s.amount);
 return {scenario:s,guarded,guard,steps,violations,passed:violations.length===0,blocked,recovered,exposure:violations.reduce((v,e)=>v+e.exposure,0),ledger:state};
}
export function minimize(s,code){let events=makeEvents(s);let attempts=0;let changed=true;while(changed){changed=false;for(let i=0;i<events.length;i++){let candidate=events.filter((_,j)=>j!==i);attempts++;if(run(s,false,candidate).violations.some(v=>v.code===code)){events=candidate;changed=true;break;}}}return {events,attempts,originalCount:makeEvents(s).length,result:run(s,false,events)};}
export function features(s){return [...families.map(f=>+(s.family===f)),s.delay/16,s.retryAt/12,s.copies/4,s.revokeAt/14,s.budget/s.amount,s.noise/5,(s.delay-s.retryAt)/16,(s.revokeAt-s.retryAt)/14];}
export function batch(seed,count=180){return Array.from({length:count},(_,i)=>scenario(seed+i*7919,families[i%families.length]));}
export function summarize(results){return {cases:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length,blocked:results.reduce((n,r)=>n+r.blocked,0),exposure:results.reduce((n,r)=>n+r.exposure,0),recovered:results.reduce((n,r)=>n+r.recovered,0),families:families.map(f=>({family:f,total:results.filter(r=>r.scenario.family===f).length,failed:results.filter(r=>r.scenario.family===f&&!r.passed).length})),checks:Object.entries(checks).map(([code,label])=>({code,label,failed:results.filter(r=>r.violations.some(v=>v.code===code)).length}))};}
