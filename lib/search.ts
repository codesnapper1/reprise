import model from './model/search.json';
import {features} from './simulator.mjs';
export function score(s:any){const x=features(s);return model.trees.reduce((sum,t)=>{let n=0;while(t.left[n]!==-1)n=x[t.feature[n]]<=t.threshold[n]?t.left[n]:t.right[n];return sum+t.p[n];},0)/model.trees.length;}
export const modelReport=model.report;
