// Usage: node scripts/evaluate-agent.mjs ./examples/guarded-agent.mjs 42017 60
import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {writeFileSync} from 'node:fs';
import {batch,summarize} from '../lib/simulator.mjs';import {evaluateAgent} from '../lib/agent-sdk.mjs';
const [file,seedArg='42017',countArg='60']=process.argv.slice(2);if(!file)throw new Error('Provide a local JS module exporting async decide(observation, tools).');
const seed=Number(seedArg),count=Number(countArg);if(!Number.isInteger(seed)||seed<1||!Number.isInteger(count)||count<6||count>360)throw new Error('Seed must be a positive integer; count must be 6–360.');
const {decide}=await import(pathToFileURL(resolve(file)).href);if(typeof decide!=='function')throw new Error('Module must export decide.');
const results=[];for(const s of batch(seed,count)){results.push(await evaluateAgent(s,decide));}
const report={agent:file,seed,count,summary:summarize(results),results};writeFileSync('agent-evaluation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report.summary,null,2));
