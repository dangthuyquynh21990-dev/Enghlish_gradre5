import json,hashlib,base64,os
texts=json.load(open('texts.json'));out=['const AUDIO={'];miss=0;tot=0
for t in texts:
    h=hashlib.sha1(t.encode()).hexdigest()[:12];f=f'mp3/{h}.mp3'
    if not os.path.exists(f): miss+=1;continue
    b=open(f,'rb').read();tot+=len(b)
    out.append(json.dumps(t,ensure_ascii=False)+':"data:audio/mpeg;base64,'+base64.b64encode(b).decode()+'",')
out.append('};')
open('../app/audio.js','w').write('\n'.join(out))
print('missing',miss,'mp3 bytes',tot,'js bytes',os.path.getsize('../app/audio.js'))
