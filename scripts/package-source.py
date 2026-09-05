from pathlib import Path
import zipfile,json
root=Path(__file__).resolve().parents[1]
exclude={'.git','node_modules','dist','.wrangler','.sites-runtime','.next','.openai','outputs','work','__pycache__'}
with zipfile.ZipFile(root/'public/reprise-source.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if not p.is_file():continue
  rel=p.relative_to(root)
  if any(part in exclude for part in rel.parts) or p.name.startswith('.env') or p.suffix in {'.zip','.tsbuildinfo'} or p.name=='agent-evaluation.json':continue
  z.write(p,'reprise/'+str(rel))
 z.writestr('reprise/.openai/hosting.json',json.dumps({'d1':'DB','r2':None},indent=2)+'\n')
print('Created public/reprise-source.zip')
