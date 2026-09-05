import {batch,features,run} from '../../lib/simulator.mjs';
import {writeFileSync} from 'node:fs';
const rows=batch(19001,8000).map(s=>({seed:s.seed,x:features(s),y:+!run(s,false).passed}));
const test=batch(900000001,2000).map(s=>({seed:s.seed,x:features(s),y:+!run(s,false).passed}));
writeFileSync('/tmp/reprise-training.json',JSON.stringify({rows,test}));
console.log('Generated 8,000 training and 2,000 held-out executed traces.');
