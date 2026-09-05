// Replace this function with your own agent or model call. Tools are simulator-only.
export async function decide(observation,tools){
 const o=observation;const status=await tools.lookupPayment(o.event.intent);
 if(o.event.type==='refund.request')return o.refunded[o.event.intent]>=status.captured?'hold':'execute';
 if(!o.consent||!status.terminal||status.captured>=o.amount||o.spent+o.amount>o.budget)return 'hold';
 return 'execute';
}
