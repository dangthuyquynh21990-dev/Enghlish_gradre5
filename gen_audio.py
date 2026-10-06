import json,sys,hashlib,subprocess,time,os
import numpy as np
from kokoro_onnx import Kokoro
wi,wn=int(sys.argv[1]),int(sys.argv[2])
texts=json.load(open('texts.json'))
texts=sorted(texts,key=len)  # short first
mine=texts[wi::wn]
k=Kokoro('kokoro.onnx','voices.bin')
t0=time.time();done=0
for t in mine:
    h=hashlib.sha1(t.encode()).hexdigest()[:12]
    out=f'mp3/{h}.mp3'
    if os.path.exists(out): done+=1;continue
    sp=0.85 if len(t.split())<=3 else 0.9
    s,sr=k.create(t,voice='af_heart',speed=sp,lang='en-us')
    pcm=(np.clip(s,-1,1)*32767).astype('<i2').tobytes()
    p=subprocess.run(['ffmpeg','-loglevel','error','-y','-f','s16le','-ar',str(sr),'-ac','1','-i','-','-ar','22050','-c:a','libmp3lame','-b:a','24k',out],input=pcm)
    done+=1
    if done%20==0: print(wi,done,len(mine),round(time.time()-t0),flush=True)
print(wi,'DONE',round(time.time()-t0),flush=True)
