import {makeEvents,run} from './simulator.mjs';
/** Evaluate an async user-owned agent in the simulator. The agent never receives a live money tool. */
export async function evaluateAgent(s,decide){
 const events=makeEvents(s),decisions={};let calls=0;
 for(let i=0;i<events.length;i++){
  const event=events[i];if(!['recovery.request','refund.request'].includes(event.type))continue;
  const prefix=run(s,false,events.slice(0,i),{},decisions);const l=prefix.ledger;
  const observation={event,amount:s.amount,budget:s.budget,consent:l.consent,spent:l.spent,merchantCaptured:{...l.observed},refunded:{...l.refunded},previousActions:{...decisions}};
  // Simulated status lookup deliberately exists as a tool, not an invisible prompt hint.
  const tools={lookupPayment:async(intent)=>({captured:l.captured[intent]??0,terminal:l.terminal[intent]??false})};
  let timer;const choice=await Promise.race([Promise.resolve(decide(structuredClone(observation),tools)),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Agent exceeded the 15-second decision limit')),15000);})]).finally(()=>clearTimeout(timer));
  if(!['hold','execute'].includes(choice))throw new Error('decide() must return hold or execute');decisions[i]=choice==='hold'?'hold':'execute';calls++;
 }
 return {...run(s,false,events,{},decisions),agentCalls:calls,decisions};
}
