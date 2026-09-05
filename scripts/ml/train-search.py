"""Learn failure priority from actual executions in the local payment simulator."""
import json,pathlib,hashlib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import roc_auc_score,precision_score,recall_score,brier_score_loss
root=pathlib.Path(__file__).resolve().parents[2]
d=json.load(open('/tmp/reprise-training.json'));X=np.array([r['x'] for r in d['rows']]);y=np.array([r['y'] for r in d['rows']]);Xt=np.array([r['x'] for r in d['test']]);yt=np.array([r['y'] for r in d['test']])
m=RandomForestClassifier(n_estimators=32,max_depth=6,min_samples_leaf=8,random_state=43,n_jobs=1).fit(X,y);p=m.predict_proba(Xt)[:,1]
trees=[]
for e in m.estimators_:
 t=e.tree_;trees.append({'left':t.children_left.tolist(),'right':t.children_right.tolist(),'feature':t.feature.tolist(),'threshold':t.threshold.tolist(),'p':[float(v[0,1]/sum(v[0])) for v in t.value]})
rank=np.argsort(-p,kind='stable');budget=200;r=np.random.default_rng(641);random_counts=[int(sum(yt[r.choice(len(yt),budget,replace=False)])) for _ in range(1000)]
report={'model':'Random forest, 32 trees, maximum depth 6','version':'failure-search-1','trainingRecords':len(y),'heldOutRecords':len(yt),'rocAuc':round(float(roc_auc_score(yt,p)),4),'precision':round(float(precision_score(yt,p>=.5)),4),'recall':round(float(recall_score(yt,p>=.5)),4),'brier':round(float(brier_score_loss(yt,p)),4),'searchBudget':budget,'rankedFailures':int(sum(yt[rank[:budget]])),'randomFailuresMean':round(float(np.mean(random_counts)),1),'randomFailuresP025':float(np.quantile(random_counts,.025)),'randomFailuresP975':float(np.quantile(random_counts,.975)),'provenance':'Labels come from running the reference policy through the deterministic simulator, not LLM-generated labels.','limitations':['All data describes the included reference implementation and six modeled failure families; these are not production incident frequencies.','Held-out seeds test new timings, not unseen payment providers or unseen agent code.','Risk ranking can concentrate on familiar bugs. The UI mixes 80% ranking with 20% uniform exploration.','This is a scenario prioritizer, not a proof of safety or a financial-loss forecast.','Exposure sums invariant breaches across independent tests and may overlap within a test.']}
artifact={'trees':trees,'report':report};raw=json.dumps(artifact,separators=(',',':'))+'\n';(root/'lib/model/search.json').write_text(raw);report['artifactSha256']=hashlib.sha256(raw.encode()).hexdigest();(root/'docs/search-model-report.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
