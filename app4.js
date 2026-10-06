// ===== utils =====
const $app=document.getElementById('app');
const put=(...k)=>$app.append(...k.flat(9).filter(x=>x!=null&&x!==false));
const h=(tag,attrs,...kids)=>{const e=document.createElement(tag);for(const[k,v]of Object.entries(attrs||{})){if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v)}for(const c of kids.flat(9)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c))}return e};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>String(s).toLowerCase().replace(/[\u2018\u2019`]/g,"'").replace(/[.?!,;:"]/g,' ').replace(/\s+/g,' ').trim();
const SPK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10v4h4l5 4V6L7 10H3zm13.5 2a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>';
// strip stress markers from the stress exercise options so they don't give the answer away
SECTIONS[0].sets[1].items.forEach(it=>{it.a=it.a.replace(/<\/?b>/g,'');it.w=it.w.map(x=>x.replace(/<\/?b>/g,''))});

let progress={};
try{progress=JSON.parse(localStorage.getItem('ga5-progress')||'{}')||{}}catch(e){}
const saveProgress=()=>{try{localStorage.setItem('ga5-progress',JSON.stringify(progress))}catch(e){}};
const starsOf=p=>p>=90?3:p>=70?2:p>=40?1:0;
const starsEl=p=>{const n=p==null?0:starsOf(p);return h('span',{class:'stars','aria-label':p==null?'Chưa làm':n+' trên 3 sao'},...[0,1,2].map(i=>h('span',{class:i<n?'':'off'},'★')))};

// ===== speech =====
let voices=[];
const loadVoices=()=>{try{voices=speechSynthesis.getVoices()}catch(e){}};
try{loadVoices();speechSynthesis.onvoiceschanged=loadVoices}catch(e){}
const hasTTS=()=>{try{return'speechSynthesis'in window}catch(e){return false}};
let curAudio=null;
function stopAudio(){try{if(curAudio){curAudio.pause();curAudio=null}}catch(e){}try{speechSynthesis.cancel()}catch(e){}}
function ttsFallback(text,rate){return new Promise(res=>{if(!hasTTS()){res();return}try{const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=rate;const v=voices.find(v=>/^en[-_]US/i.test(v.lang))||voices.find(v=>/^en/i.test(v.lang));if(v)u.voice=v;u.onend=()=>res();u.onerror=()=>res();speechSynthesis.speak(u)}catch(e){res()}})}
function speak(text,rate=.85){return new Promise(res=>{stopAudio();const src=(typeof AUDIO!=='undefined')&&AUDIO[text];
  if(!src){ttsFallback(text,rate).then(res);return}
  try{const au=new Audio(src);curAudio=au;au.playbackRate=rate<.7?.75:1;au.onended=()=>res();au.onerror=()=>ttsFallback(text,rate).then(res);
    const pr=au.play();if(pr&&pr.catch)pr.catch(()=>ttsFallback(text,rate).then(res))}catch(e){ttsFallback(text,rate).then(res)}})}
const ibtn=(text,label)=>h('button',{class:'ibtn',type:'button','aria-label':label||'Nghe',html:SPK,onclick:e=>{e.stopPropagation();speak(text)}});
const audioBtns=text=>h('div',{class:'snd'},
  h('button',{class:'btn sm',type:'button',html:SPK+'<span>Nghe</span>',onclick:()=>speak(text,.85)}),
  h('button',{class:'btn sm alt',type:'button',html:SPK+'<span>Nghe chậm</span>',onclick:()=>speak(text,.55)}));

// ===== views =====
function go(fn){stopAudio();$app.replaceChildren();fn();window.scrollTo(0,0)}
// ===== unit generator =====
const GROUPS=[['phon','Phát âm','Phonetics','var(--c-phon)'],['vocab','Từ vựng','Vocabulary','var(--c-vocab)'],['gram','Ngữ pháp','Grammar','var(--c-gram)'],['read','Đọc hiểu','Reading','var(--c-read)'],['write','Viết','Writing','var(--c-write)'],['listen','Nghe','Listening','var(--c-listen)'],['adv','Nâng cao','Advanced','var(--c-adv)'],['test','Kiểm tra tổng hợp','Unit test','var(--c-test)']];
const form=x=>x[5]||x[0];
const pick=(a,n)=>shuffle(a).slice(0,n);
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function buildUnit(u){
  const id=k=>`u${u.n}-${k}`;const V=u.v;const g={phon:[],vocab:[],gram:[],read:[],write:[],listen:[],adv:[],test:[]};
  // Phonetics
  if(u.ph&&u.ph.length)g.phon.push({id:id('ph'),t:'Gạch chân phát âm khác',d:'Chọn từ có phần gạch chân đọc khác',kind:'mcq',ins:'Choose the word whose underlined part is pronounced differently.',vi:'Chọn từ có phần gạch chân phát âm khác với các từ còn lại.',items:u.ph});
  if(u.stress&&u.stress.length)g.phon.push({id:id('st'),t:'Trọng âm từ',d:'Từ nào nhấn vào âm tiết nào?',kind:'mcq',listen:true,ins:'Choose the syllable that has the main stress.',vi:'Bấm loa để nghe từ, rồi chọn âm tiết mang trọng âm chính.',items:u.stress.map(([w,k,n])=>({say:w,q:`Trọng âm chính của <b>${w}</b> rơi vào âm tiết nào?`,o:Array.from({length:n},(_,i)=>'Âm tiết '+(i+1)),c:k-1,why:`${w} nhấn ở âm tiết thứ ${k}.`}))});
  // Vocabulary
  g.vocab.push({id:id('vm'),t:'Chọn nghĩa đúng',d:'Từ tiếng Anh nghĩa là gì?',kind:'mcq',ins:'Choose the correct Vietnamese meaning.',vi:'Chọn nghĩa tiếng Việt đúng của từ.',items:V.map(x=>({say:x[0],q:`<b>${x[0]}</b>`,a:x[1],w:pick(V.filter(y=>y!==x).map(y=>y[1]),3),why:`Ví dụ: ${x[2]}`}))});
  const pv=V.filter((x,i)=>V.findIndex(y=>y[4]===x[4])===i);
  g.vocab.push({id:id('vp'),t:'Nhìn hình chọn từ',d:'Chọn từ khớp với hình',kind:'mcq',ins:'Look at the picture and choose the word.',vi:'Nhìn hình rồi chọn từ tiếng Anh đúng.',items:pv.map(x=>({q:`<span style="font-size:3rem;line-height:1.2">${x[4]}</span>`,a:x[0],w:pick(pv.filter(y=>y!==x).map(y=>y[0]),3),why:`${x[0]}: ${x[1]}`}))});
  const fill=V.filter(x=>x[2].toLowerCase().includes(form(x).toLowerCase()));
  if(fill.length>=4){const fi=fill.slice(0,6);g.vocab.push({id:id('vf'),t:'Điền từ vào câu',d:'Chọn từ trong khung điền vào chỗ trống',kind:'bank',ins:'Complete the sentences with the words in the box.',vi:'Chọn từ trong khung để hoàn thành câu.',bank:fi.map(form),items:fi.map(x=>({t:x[2].replace(new RegExp(escRe(form(x)),'i'),'___'),a:form(x)}))})}
  g.vocab.push({id:id('vn'),t:'Nối từ và nghĩa',d:'Nối từ tiếng Anh với nghĩa tiếng Việt',kind:'match',ins:'Match the words with their meanings.',vi:'Bấm một từ bên trái, rồi bấm nghĩa tương ứng bên phải.',pairs:V.slice(0,8).map(x=>[x[0],x[1]])});
  if(pv.length>=5)g.vocab.push({id:id('vt'),t:'Nối từ và tranh',d:'Nối từ với hình minh hoạ',kind:'match',pics:true,ins:'Match the words with the pictures.',vi:'Bấm một từ bên trái, rồi bấm hình tương ứng bên phải.',pairs:pv.slice(0,6).map(x=>[x[0],x[4]])});
  // Grammar
  g.gram.push({id:id('g'),t:'Cấu trúc trọng tâm',d:'Luyện mẫu câu của Unit',kind:'mcq',ins:'Choose the correct answer.',vi:'Chọn đáp án đúng theo mẫu câu của Unit.',tip:'<b>Mẫu câu:</b><br>'+u.struct.join('<br>'),items:u.g});
  // Reading
  const R=u.r;
  g.read.push({id:id('rt'),t:'Read and tick True or False',d:'Đọc đoạn văn, chọn Đúng hoặc Sai',kind:'mcq',passage:R.p,ins:'Read and tick True (T) or False (F).',vi:'Đọc đoạn văn rồi chọn Đúng hoặc Sai.',items:R.tf.map(([q,tf,why])=>({q,tf,why}))});
  g.read.push({id:id('rq'),t:'Read and answer',d:'Đọc đoạn văn và trả lời câu hỏi',kind:'type',passage:R.p,ins:'Read and answer the questions.',vi:'Gõ câu trả lời ngắn (chỉ cần có từ khoá đúng).',items:R.qa.map(([q,kw,m])=>T(q,kw,'Đáp án mẫu: '+m,{k:true,wide:true}))});
  // cloze
  {const words=[...new Set((R.p.match(/[A-Za-z']+/g)||[]))];const vs=new Set(V.map(x=>x[0].toLowerCase()));
   let cand=words.filter(w=>vs.has(w.toLowerCase())&&w.length>3);
   if(cand.length<5)cand=cand.concat(words.filter(w=>w.length>=6&&!/^[A-Z]/.test(w)&&!cand.includes(w)));
   cand=cand.slice(0,5).sort((a,b)=>R.p.indexOf(a)-R.p.indexOf(b));
   if(cand.length>=3){let txt=R.p;const items=[];cand.forEach((w,i)=>{txt=txt.replace(new RegExp('\\b'+escRe(w)+'\\b'),`<b>(${i+1})</b>`);const pool=[...new Set(words.filter(x=>x.length>=4&&x.toLowerCase()!==w.toLowerCase()&&!cand.includes(x)&&!x.toLowerCase().startsWith(w.toLowerCase().slice(0,4))))];items.push({q:`(${i+1})`,a:w,w:pick(pool,3),why:'Từ đúng: '+w})});
     g.read.push({id:id('rg'),t:'Read and complete the text',d:'Chọn từ điền vào đoạn văn',kind:'mcq',passage:txt,ins:'Read and complete the text.',vi:'Chọn từ thích hợp cho mỗi chỗ trống.',items})}}
  // Writing
  const ord=V.map(x=>x[2]).filter(s=>{const n=s.split(' ').length;return n>=4&&n<=10});
  if(ord.length>=3)g.write.push({id:id('wo'),t:'Sắp xếp từ thành câu',d:'Sắp xếp các từ bị xáo trộn',kind:'order',ins:'Put the words in order to make sentences.',vi:'Bấm vào từ để xếp thành câu. Bấm lại để bỏ từ ra.',items:ord.slice(0,6).map(s=>({w:s.replace(/[.?!]+$/,'').split(' '),a:s}))});
  g.write.push({id:id('wr'),t:'Viết lại câu',d:'Câu phủ định, nghi vấn, chuyển đổi theo mẫu',kind:'type',ins:'Rewrite the sentences.',vi:'Viết lại câu theo yêu cầu. Chỉ cần đúng từ và thứ tự từ.',items:u.rw.map(([q,a,why])=>T(q,a,why,{wide:true}))});
  g.write.push({id:id('wg'),t:'Viết đoạn: '+u.w.t,d:'Viết 3-5 câu theo gợi ý',kind:'write',ins:'Write 3-5 sentences.',vi:'Dựa vào gợi ý rồi tự viết, sau đó xem bài mẫu.',hints:u.w.hints,kw:u.w.kw,model:u.w.model});
  // Listening
  g.listen.push({id:id('lt'),t:'Listen and tick',d:'Nghe câu và chọn hình đúng',kind:'mcq',pics:true,listen:true,ins:'Listen and tick the correct picture.',vi:'Bấm Nghe, rồi chọn hình đúng. Bạn có thể nghe lại nhiều lần.',items:pick(pv,6).map(x=>({say:x[2],a:x[4],w:pick(pv.filter(y=>y!==x).map(y=>y[4]),3),why:`${x[0]}: ${x[1]}`}))});
  g.listen.push({id:id('lf'),t:'Listen and fill in',d:'Nghe và điền từ còn thiếu',kind:'type',listen:true,ins:'Listen and fill in the missing words.',vi:'Nghe rồi gõ từ hoặc cụm từ còn thiếu vào chỗ trống.',items:fill.slice(0,6).map(x=>T(x[2].replace(new RegExp(escRe(form(x)),'i'),'___'),form(x),'Nội dung: '+x[2],{say:x[2],wide:form(x).includes(' ')}))});
  g.listen.push({id:id('ltf'),t:'Listen and write T or F',d:'Nghe đoạn văn, chọn Đúng hoặc Sai',kind:'mcq',listen:true,say:R.p,ins:'Listen and write True or False.',vi:'Nghe cả đoạn văn (nghe nhiều lần được), rồi cho biết mỗi câu đúng hay sai.',items:R.tf.map(([q,tf,why])=>({q,tf,why}))});
  // Advanced
  const A=u.adv;
  if(A){
    g.adv.push({id:id('ag'),t:'Ngữ pháp nâng cao',d:'Câu hỏi khó hơn, nhiều bẫy hơn',kind:'mcq',ins:'Choose the correct answer. (Advanced)',vi:'Các câu hỏi vận dụng, có nhiều lựa chọn gây nhầm lẫn.',items:A.g});
    g.adv.push({id:id('ae'),t:'Tìm và sửa lỗi sai',d:'Viết lại câu cho đúng',kind:'type',ins:'Find the mistake and write the correct sentence.',vi:'Mỗi câu có một lỗi. Gõ lại cả câu đúng.',items:A.err.map(([w,c,why])=>T('Tìm lỗi và viết lại câu đúng:<br><b>'+w+'</b>',[c],'Đáp án: '+c+'. '+why,{wide:true}))});
    g.adv.push({id:id('ar'),t:'Đọc hiểu nâng cao',d:'Đoạn văn dài hơn, có câu hỏi suy luận',kind:'mcq',passage:A.r.p,ins:'Read the passage and choose the best answer.',vi:'Đọc kỹ rồi chọn đáp án đúng nhất. Có câu hỏi về nghĩa của từ và ý chính.',items:A.r.q});
    g.adv.push({id:id('al'),t:'Nghe hiểu nâng cao',d:'Nghe đoạn văn dài và trả lời câu hỏi',kind:'mcq',listen:true,say:A.r.p,ins:'Listen to the passage and choose the best answer.',vi:'Nghe đoạn văn (nghe nhiều lần được), không có chữ để đọc, rồi chọn đáp án.',items:A.r.q});
    g.adv.push({id:id('aw'),t:'Viết đoạn nâng cao: '+A.w.t,d:'Viết 5-7 câu theo gợi ý',kind:'write',minS:5,ins:'Write 5-7 sentences.',vi:'Dựa vào gợi ý, viết đoạn văn 5-7 câu rồi so với bài mẫu.',hints:A.w.hints,kw:A.w.kw,model:A.w.model});
  }
  // Unit tests (new random sample each time)
  const sub=(s,n)=>s?Object.assign({},s,{items:pick(s.items,n)}):null;
  const byId=(arr,k)=>arr.find(s=>s.id===id(k));
  const lab=(s,ins,vi)=>s?Object.assign(s,{ins:ins||s.ins,vi:vi||s.vi}):null;
  g.test.push({id:id('test'),t:'Kiểm tra tổng hợp Unit '+u.n,d:'Khoảng 30 câu, gồm cả nghe, đọc, viết. Mỗi lần làm đổi câu hỏi.',kind:'mix',gen:()=>{
    const bk=byId(g.vocab,'vf');let fl=null;if(bk){const it=pick(bk.items,3);fl=Object.assign({},bk,{items:it,bank:it.map(x=>x.a)})}
    return [sub(byId(g.phon,'ph'),1)&&lab(sub(byId(g.phon,'ph'),1)),sub(byId(g.phon,'st'),2),sub(byId(g.vocab,'vm'),4),sub(byId(g.vocab,'vp'),3),fl,sub(byId(g.gram,'g'),5),sub(byId(g.read,'rt'),4),sub(byId(g.write,'wo'),2),sub(byId(g.write,'wr'),2),sub(byId(g.listen,'lt'),3),sub(byId(g.listen,'lf'),3)].filter(x=>x&&x.items&&x.items.length)}});
  if(A)g.test.push({id:id('testadv'),t:'Kiểm tra nâng cao Unit '+u.n,d:'Khoảng 18 câu khó hơn: ngữ pháp, sửa lỗi, đọc và nghe hiểu.',kind:'mix',gen:()=>[sub(byId(g.adv,'ag'),5),sub(byId(g.adv,'ae'),3),sub(byId(g.adv,'ar'),4),sub(byId(g.adv,'al'),4)].filter(Boolean)});
  const groups=GROUPS.map(([k,vi,en,c])=>({id:u.n+'-'+k,en,vi,c,backLabel:'Unit '+u.n,sets:g[k].filter(Boolean)})).filter(x=>x.sets.length);
  return{u,groups,sets:groups.flatMap(x=>x.sets),topics:[{t:'Unit '+u.n+': '+u.t,w:V.map(x=>[x[0],'','',x[1],x[2],x[3],x[4],x[5]])}]};
}
const BUILT=UNITS.map(buildUnit);
const PCOL=['var(--c-read)','var(--c-vocab)','var(--c-gram)','var(--c-phon)'];
const PARTS=[...new Set(UNITS.map(u=>u.part))];
const allSetIds=[...BUILT.flatMap(b=>b.sets.map(s=>s.id)),...SECTIONS.flatMap(s=>s.sets.map(x=>x.id))];
const doneCount=()=>allSetIds.filter(i=>progress[i]!=null).length;

// ===== fun helpers =====
function mascot(mood){
  const mouth=mood==='wow'?'<ellipse cx="60" cy="88" rx="9" ry="10" fill="#14274A"/><ellipse cx="60" cy="93" rx="5" ry="4" fill="#FF8FA3"/>':mood==='try'?'<path d="M50 88 Q60 94 70 88" fill="none" stroke="#14274A" stroke-width="4" stroke-linecap="round"/>':'<path d="M46 82 Q60 100 74 82" fill="none" stroke="#14274A" stroke-width="4" stroke-linecap="round"/>';
  return '<svg class="mascot" viewBox="0 0 120 120" role="img" aria-label="Bạn Bi, linh vật của app"><ellipse cx="60" cy="113" rx="30" ry="5" fill="rgba(0,0,0,.18)"/><circle cx="60" cy="64" r="44" fill="#FFC83D" stroke="#14274A" stroke-width="4"/><path d="M22 40 L60 22 L98 40 L60 56Z" fill="#2F6BFF" stroke="#14274A" stroke-width="4" stroke-linejoin="round"/><path d="M98 40 V60" stroke="#14274A" stroke-width="4" stroke-linecap="round"/><circle cx="98" cy="62" r="5" fill="#E0327C" stroke="#14274A" stroke-width="3"/><g class="eyes"><ellipse cx="44" cy="70" rx="6" ry="8" fill="#14274A"/><ellipse cx="76" cy="70" rx="6" ry="8" fill="#14274A"/><circle cx="46" cy="67" r="2.2" fill="#fff"/><circle cx="78" cy="67" r="2.2" fill="#fff"/></g><circle cx="31" cy="82" r="6" fill="#FF8FA3" opacity=".75"/><circle cx="89" cy="82" r="6" fill="#FF8FA3" opacity=".75"/>'+mouth+'</svg>';
}
function confetti(){
  const box=h('div',{class:'confetti','aria-hidden':'true'});const cols=['#FFC83D','#E0327C','#2F6BFF','#0F9D8F','#8353F0','#EE6418'];
  for(let i=0;i<46;i++)box.append(h('i',{style:`left:${Math.random()*100}%;background:${cols[i%6]};animation-delay:${Math.random()*.6}s;animation-duration:${1.8+Math.random()*1.4}s;transform:rotate(${Math.random()*360}deg)`}));
  document.body.append(box);setTimeout(()=>box.remove(),3600);
}
function jingle(good){try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const ctx=new C();const notes=good?[523,659,784,1047]:[392,349];notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='triangle';o.frequency.value=f;o.connect(g);g.connect(ctx.destination);const t=ctx.currentTime+i*.13;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.18,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+.22);o.start(t);o.stop(t+.25)});setTimeout(()=>{try{ctx.close()}catch(e){}},1200)}catch(e){}}
const LEVELS=['Hạt giống','Mầm non','Cây con','Hoa nhỏ','Ong thợ','Cú thông thái','Siêu sao'];
const totalStars=()=>allSetIds.reduce((n,i)=>n+(progress[i]!=null?starsOf(progress[i]):0),0);
const GICON={phon:'🗣️',vocab:'🍎',gram:'🧩',read:'📖',write:'✏️',listen:'🎧',adv:'🚀',test:'🏆'};

// ===== views =====
function viewHome(){
  const done=doneCount();const total=allSetIds.length;
  const wordCount=UNITS.reduce((n,u)=>n+u.v.length,0);
  put(
    h('div',{class:'hero'},
      h('div',{class:'who'},h('div',{html:mascot(done?'happy':'wow')}),h('div',{class:'bubble'},h('h1',{},'Tiếng Anh lớp 5'),h('div',{},done===0?'Chào bạn! Mình là Bi. Hôm nay mình cùng học Unit nào nhỉ?':done<40?'Giỏi lắm! Mình học tiếp nhé.':'Bạn đang học rất chăm! Cố lên nào.'),
        h('div',{class:'stats'},h('span',{class:'stat'},'★ '+totalStars()+' sao'),h('span',{class:'stat lv'},'Cấp: '+LEVELS[Math.min(Math.floor(totalStars()/25),LEVELS.length-1)])))),
      h('div',{class:'prog'},h('b',{},`${done}/${total} bài đã làm`),h('div',{class:'bar'},h('i',{style:`width:${Math.round(done/total*100)}%`})))),
    PARTS.map((p,pi)=>{const bs=BUILT.filter(b=>b.u.part===p);const first=bs[0].u.n,last=bs[bs.length-1].u.n;
      return h('section',{class:'part'},h('h2',{},p,h('span',{},` · Unit ${first}-${last}`)),
        h('div',{class:'tiles'},bs.map(b=>{const d=b.sets.filter(s=>progress[s.id]!=null).length;
          return h('button',{class:'tile unit',type:'button',style:`--c:${PCOL[pi]}`,onclick:()=>go(()=>viewUnit(b))},
            h('span',{class:'ico','aria-hidden':'true'},b.u.v[0][4]),h('span',{class:'un'},'Unit '+b.u.n),h('span',{class:'en'},b.u.t),h('span',{class:'vi'},b.u.vi),
            h('span',{class:'meta'},h('span',{},`${b.u.v.length} từ`),h('span',{class:'mini'},h('i',{style:`width:${Math.round(d/b.sets.length*100)}%`})),
              h('span',{},`${d}/${b.sets.length} bài`)))})))}),
    h('section',{class:'part'},h('h2',{},'Ôn tập tổng hợp'),
      h('div',{class:'tiles'},h('button',{class:'tile study',type:'button',onclick:()=>go(viewReview)},h('span',{class:'en'},'Ôn theo dạng bài'),h('span',{class:'vi'},'Các dạng bài chung cho cả năm: trọng âm, -ed, -s/-es, các thì, so sánh, đọc, viết, nghe'),h('span',{class:'meta'},h('span',{},`${SECTIONS.length} nhóm`),h('span',{},'Từ vựng theo chủ đề'))))),
    h('p',{class:'note'},`Tổng cộng ${wordCount} từ và cụm từ theo sách, mỗi từ có câu ví dụ. Phần Nghe dùng giọng đọc của thiết bị, hãy bật loa hoặc đeo tai nghe.`));
}

function viewStudy(topics,idx,title,back){
  let hide=false;
  const top=h('div',{class:'top'},h('button',{class:'back',type:'button',onclick:back},'\u2190 Quay lại'),h('span',{class:'crumb'},title));
  const chips=h('div',{class:'chips',role:'tablist'});
  const list=h('div',{class:'wlist'});
  const toggle=h('button',{class:'btn alt sm',type:'button',onclick:()=>{hide=!hide;list.classList.toggle('hide-vn',hide);toggle.textContent=hide?'Hiện nghĩa':'Che nghĩa để tự kiểm tra'}},'Che nghĩa để tự kiểm tra');
  const hl=(s,w)=>s.replace(new RegExp('\\b('+escRe(w)+')','i'),'<mark>$1</mark>');
  function draw(){
    if(topics.length>1)chips.replaceChildren(...topics.map((t,i)=>h('button',{class:'tp'+(i===idx?' on':''),type:'button',role:'tab','aria-selected':i===idx,onclick:()=>{idx=i;draw()}},t.t)));
    list.replaceChildren(...topics[idx].w.map(([en,ipa,pos,vi,ex,exvi,em,fm])=>{
      const card=h('div',{class:'wc',onclick:()=>card.classList.toggle('show')},
        h('div',{class:'em','aria-hidden':'true'},em),
        h('div',{class:'bd'},
          h('div',{class:'w'},en,ibtn(en,'Nghe từ '+en)),
          (ipa||pos)?h('div',{},ipa?h('span',{class:'ipa'},ipa+' '):null,pos?h('span',{class:'pos'},pos):null):null,
          h('div',{class:'vn'},vi),
          h('div',{class:'exs'},h('div',{class:'e1',html:hl(ex,fm||en)+' '}),h('div',{class:'e2'},exvi))));
      card.querySelector('.e1').append(ibtn(ex,'Nghe câu ví dụ'));
      return card}));
  }
  draw();
  put(top,h('div',{class:'sechead'},h('h1',{},'Học từ vựng'),h('p',{},'Mỗi từ có nghĩa và một câu ví dụ có dịch. Bấm vào loa để nghe.')),topics.length>1?chips:null,h('div',{class:'actions',style:'margin:0 0 14px'},toggle),list);
}

function viewUnit(b){
  const u=b.u;
  put(
    h('div',{class:'top'},h('button',{class:'back',type:'button',onclick:()=>go(viewHome)},'\u2190 Trang chủ'),h('span',{class:'crumb'},u.part)),
    h('div',{class:'unithead'},h('div',{class:'ico','aria-hidden':'true'},u.v[0][4]),h('div',{},h('p',{},'Unit '+u.n+' \u00b7 '+u.vi),h('h1',{},u.t))),
    h('div',{class:'tip'},h('b',{},'Mẫu câu trọng tâm'),h('br'),...u.struct.flatMap(s=>[s,h('br')])),
    h('button',{class:'row study-row',type:'button',style:'--c:var(--sun)',onclick:()=>go(()=>viewStudy(b.topics,0,'Unit '+u.n+' · '+u.t,()=>go(()=>viewUnit(b))))},
      h('span',{class:'dot'}),h('span',{class:'tx'},h('b',{},'Học từ vựng Unit '+u.n),h('span',{},`${u.v.length} từ, có câu ví dụ, nghe phát âm`))),
    b.groups.map(gr=>h('section',{class:'part'},h('h2',{},(GICON[gr.id.split('-')[1]]||'')+' '+gr.en,h('span',{},' · '+gr.vi)),
      h('div',{class:'rows'},gr.sets.map(set=>h('button',{class:'row',type:'button',style:`--c:${gr.c}`,onclick:()=>go(()=>viewExercise(gr,set,()=>go(()=>viewUnit(b))))},
        h('span',{class:'dot','aria-hidden':'true'},GICON[gr.id.split('-')[1]]||''),h('span',{class:'tx'},h('b',{},set.t),h('span',{},set.d)),starsEl(progress[set.id])))))));
}

function viewReview(){
  put(
    h('div',{class:'top'},h('button',{class:'back',type:'button',onclick:()=>go(viewHome)},'\u2190 Trang chủ'),h('span',{class:'crumb'},'Ôn tập tổng hợp')),
    h('div',{class:'sechead'},h('h1',{},'Ôn tập tổng hợp'),h('p',{},'Các dạng bài dùng chung cho cả năm học.')),
    h('div',{class:'tiles'},
      h('button',{class:'tile study',type:'button',onclick:()=>go(()=>viewStudy(VOCAB.map(t=>({t:t.t,w:t.w})),0,'Từ vựng theo chủ đề',()=>go(viewReview)))},h('span',{class:'en'},'Từ vựng theo chủ đề'),h('span',{class:'vi'},'72 từ có phiên âm, nghĩa và ví dụ')),
      SECTIONS.map(s=>{const d=s.sets.filter(x=>progress[x.id]!=null).length;
        return h('button',{class:'tile',type:'button',style:`--c:${s.c}`,onclick:()=>go(()=>viewSection(s))},h('span',{class:'en'},s.en),h('span',{class:'vi'},s.vi),h('span',{class:'meta'},h('span',{},`${s.sets.length} dạng bài`),h('span',{},`${d}/${s.sets.length} đã làm`)))})));
}

function viewSection(s){
  put(
    h('div',{class:'top'},h('button',{class:'back',type:'button',onclick:()=>go(viewReview)},'\u2190 Ôn tập tổng hợp'),h('span',{class:'crumb'},s.en)),
    h('div',{class:'sechead'},h('h1',{},s.en+' \u00b7 '+s.vi),h('p',{},'Chọn một dạng bài để bắt đầu.')),
    h('div',{class:'rows'},s.sets.map(set=>h('button',{class:'row',type:'button',style:`--c:${s.c}`,onclick:()=>go(()=>viewExercise(s,set))},
      h('span',{class:'dot'}),h('span',{class:'tx'},h('b',{},set.t),h('span',{},set.d)),starsEl(progress[set.id])))));
}

function viewExercise(sec,set,back){
  back=back||(()=>go(()=>viewSection(sec)));
  const eng=ENGINES[set.kind](set);
  const resultBox=h('div');
  let checked=false;
  const checkBtn=h('button',{class:'btn',type:'button',onclick:()=>{
    if(checked)return;checked=true;
    const {score,total}=eng.check();const pct=Math.round(score/total*100);
    progress[set.id]=Math.max(progress[set.id]||0,pct);saveProgress();
    eng.el.classList.add('locked');checkBtn.disabled=true;
    const msg=pct>=90?'Tuyệt vời!':pct>=70?'Làm tốt lắm!':pct>=40?'Khá rồi, thử lại để đạt điểm cao hơn nhé.':'Đừng nản, đọc lại giải thích rồi làm lại nhé.';
    resultBox.replaceChildren(h('div',{class:'result',role:'status'},h('div',{html:mascot(pct>=70?'wow':pct>=40?'happy':'try')}),h('div',{class:'sc'},`${score}/${total}`),starsEl(pct),h('div',{},h('b',{},msg),h('div',{class:'note',style:'margin:0'},'Xem giải thích ở từng câu bên trên.'))),
      h('div',{class:'actions'},h('button',{class:'btn',type:'button',onclick:()=>go(()=>viewExercise(sec,set,back))},'Làm lại'),h('button',{class:'btn alt',type:'button',onclick:back},'Chọn bài khác')));
    if(pct>=70)confetti();jingle(pct>=40);
    resultBox.scrollIntoView({behavior:'smooth',block:'nearest'});
  }},'Kiểm tra');
  put(
    h('div',{class:'top'},h('button',{class:'back',type:'button',onclick:back},'\u2190 '+(sec.backLabel||sec.en)),h('span',{class:'crumb'},set.t)),
    h('div',{class:'ins'},h('b',{},set.ins),h('p',{},set.vi)),
    set.tip?h('div',{class:'tip',html:set.tip}):null,
    set.passage?h('div',{class:'passage',html:set.passage}):null,
    set.say?h('div',{class:'ins'},h('b',{},'Bài nghe'),audioBtns(set.say)):null,
    set.listen&&!hasTTS()?h('div',{class:'tip'},'Thiết bị này chưa hỗ trợ giọng đọc nên bài nghe có thể không phát tiếng.'):null,
    eng.el,h('div',{class:'actions'},checkBtn),resultBox);
}

// ===== exercise engines: each returns {el, check()->{score,total}} =====
const fbEl=()=>h('div',{class:'fb'});
const ENGINES={
mcq(set){
  const wrap=h('div',{class:'items'});const st=[];
  set.items.forEach((it,i)=>{
    let opts;
    if('tf'in it)opts=[{t:'True (Đúng)',ok:it.tf},{t:'False (Sai)',ok:!it.tf}];
    else if(it.o)opts=it.o.map((t,k)=>({t,ok:k===it.c}));
    else opts=shuffle([{t:it.a,ok:true},...it.w.map(t=>({t,ok:false}))]);
    const o=h('div',{class:'opts'+(set.pics?' pics':'')});const fb=fbEl();
    const rec={opts,sel:null,els:[],fb,it};
    opts.forEach((op,k)=>{const b=h('button',{class:'opt',type:'button','aria-pressed':'false',html:op.t,onclick:()=>{rec.sel=k;rec.els.forEach((x,j)=>{x.classList.toggle('sel',j===k);x.setAttribute('aria-pressed',j===k)})}});rec.els.push(b);o.append(b)});
    const card=h('div',{class:'q'},h('div',{class:'qn'},i+1),h('div',{class:'qb'},
      it.say?audioBtns(it.say):null,it.q?h('div',{class:'qt',html:it.q}):null,o,fb));
    rec.card=card;st.push(rec);wrap.append(card)});
  return{el:wrap,check(){let score=0;st.forEach(r=>{const ok=r.sel!=null&&r.opts[r.sel].ok;if(ok)score++;
      r.card.classList.add(ok?'ok':'bad');
      r.els.forEach((b,k)=>{b.classList.remove('sel');if(r.opts[k].ok)b.classList.add('right');else if(k===r.sel)b.classList.add('wrong')});
      const right=r.opts.find(o=>o.ok).t;
      r.fb.innerHTML=(ok?'<span class="m">\u2713 Đúng.</span> ':'<span class="m">\u2717 Chưa đúng.</span> '+(set.pics?'':'Đáp án: <b>'+right+'</b>. '))+(r.it.say?'Nội dung bài nghe: <i>'+r.it.say+'</i>. ':'')+(r.it.why||'')});
    return{score,total:st.length}}}
},
bank(set){
  const bank=h('div',{class:'bank'},shuffle(set.bank).map(w=>h('span',{},w)));
  const wrap=h('div',{class:'items'});const st=[];
  set.items.forEach((it,i)=>{
    const sel=h('select',{class:'sel2','aria-label':'Câu '+(i+1)},h('option',{value:''},'chọn từ'),...set.bank.slice().sort().map(w=>h('option',{value:w},w)));
    const [a,b]=it.t.split('___');const fb=fbEl();
    const card=h('div',{class:'q'},h('div',{class:'qn'},i+1),h('div',{class:'qb'},h('div',{class:'qt'},a,sel,b),fb));
    st.push({sel,card,fb,it});wrap.append(card)});
  return{el:h('div',{},bank,wrap),check(){let score=0;st.forEach(r=>{const ok=r.sel.value===r.it.a;if(ok)score++;r.sel.classList.add(ok?'ok':'bad');r.card.classList.add(ok?'ok':'bad');r.fb.innerHTML=ok?'<span class="m">\u2713 Đúng.</span>':'<span class="m">\u2717 Chưa đúng.</span> Đáp án: <b>'+r.it.a+'</b>'});return{score,total:st.length}}}
},
type(set){
  const wrap=h('div',{class:'items'});const st=[];
  set.items.forEach((it,i)=>{
    const inp=h('input',{class:'txt'+(it.wide?' wide':''),type:'text',autocomplete:'off',autocapitalize:'off',spellcheck:'false','aria-label':'Câu trả lời '+(i+1)});
    let qt;
    if(it.q.includes('___')&&!it.wide){const [a,b]=it.q.split('___');qt=h('div',{class:'qt'},a,inp,b)}
    else qt=h('div',{},h('div',{class:'qt',html:it.q}),inp);
    const fb=fbEl();
    const card=h('div',{class:'q'},h('div',{class:'qn'},i+1),h('div',{class:'qb'},it.say?audioBtns(it.say):null,qt,fb));
    st.push({inp,card,fb,it});wrap.append(card)});
  return{el:wrap,check(){let score=0;st.forEach(r=>{const u=norm(r.inp.value);const acc=r.it.a.map(norm);
      const ok=u!==''&&(r.it.k?acc.some(k=>u.includes(k)):acc.includes(u));
      if(ok)score++;r.inp.classList.add(ok?'ok':'bad');r.card.classList.add(ok?'ok':'bad');
      const show=r.it.k?'':'Đáp án: <b>'+r.it.a[0]+'</b>. ';
      r.fb.innerHTML=(ok?'<span class="m">\u2713 Đúng.</span> ':'<span class="m">\u2717 Chưa đúng.</span> '+show)+(r.it.why||'')});
    return{score,total:st.length}}}
},
match(set){
  const L=set.pairs.map((p,i)=>({i,t:p[0]}));const R=shuffle(set.pairs.map((p,i)=>({i,t:p[1]})));
  const pair={};let sel=null,counter=0,done=false;const no={};
  const colL=h('div',{class:'col'}),colR=h('div',{class:'col'});const msg=fbEl();
  const hue=n=>`hsl(${(n*47)%360} 55% 38%)`;
  function badge(n){return n?h('span',{class:'nb',style:`background:${hue(n)}`},n):null}
  function unpair(l){const r=pair[l];delete pair[l];delete no['l'+l];delete no['r'+r]}
  function draw(){
    colL.replaceChildren(...L.map(x=>{const b=h('button',{class:'mb'+(sel===x.i?' pick':''),type:'button',onclick:()=>{if(done)return;if(x.i in pair){unpair(x.i);sel=x.i}else sel=(sel===x.i?null:x.i);draw()}},h('span',{},x.t),badge(no['l'+x.i]));return b}));
    colR.replaceChildren(...R.map(x=>{const lp=Object.keys(pair).find(l=>pair[l]===x.i);const b=h('button',{class:'mb'+(set.pics?' big':''),type:'button','aria-label':set.pics?'hình '+x.t:null,onclick:()=>{if(done)return;
        if(lp!=null){unpair(+lp);draw();return}
        if(sel==null)return;pair[sel]=x.i;counter++;no['l'+sel]=counter;no['r'+x.i]=counter;sel=null;draw()}},h('span',{},x.t),badge(no['r'+x.i]));return b}));
  }
  draw();
  return{el:h('div',{},h('div',{class:'match'},colL,colR),msg),check(){done=true;let score=0;const wrong=[];
    const lb=colL.children,rb=colR.children;
    L.forEach((x,k)=>{const ok=pair[x.i]===x.i;if(ok)score++;else wrong.push(x.t+' = '+set.pairs[x.i][1]);lb[k].classList.add(ok?'ok':'bad');
      const r=pair[x.i];if(r!=null){const rk=R.findIndex(y=>y.i===r);rb[rk].classList.add(ok?'ok':'bad')}});
    msg.innerHTML=wrong.length?'<span class="m">Đáp án đúng cho các cặp sai:</span> '+wrong.join(' \u00b7 '):'<span class="m">\u2713 Tất cả các cặp đều đúng.</span>';
    return{score,total:L.length}}}
},
order(set){
  const wrap=h('div',{class:'items'});const st=[];
  set.items.forEach((it,i)=>{
    const rec={built:[],pool:shuffle(it.w.map((t,k)=>({t,k}))),it,locked:false};
    const build=h('div',{class:'build','aria-label':'Câu đang xếp'}),pool=h('div',{class:'pool'});const fb=fbEl();
    const draw=()=>{
      build.replaceChildren(...rec.built.map(x=>h('button',{class:'chip',type:'button',onclick:()=>{rec.built=rec.built.filter(y=>y!==x);rec.pool.push(x);draw()}},x.t)));
      pool.replaceChildren(...rec.pool.map(x=>h('button',{class:'chip',type:'button',onclick:()=>{rec.pool=rec.pool.filter(y=>y!==x);rec.built.push(x);draw()}},x.t)))};
    draw();rec.fb=fb;
    rec.card=h('div',{class:'q'},h('div',{class:'qn'},i+1),h('div',{class:'qb'},build,pool,fb));st.push(rec);wrap.append(rec.card)});
  return{el:wrap,check(){let score=0;st.forEach(r=>{const u=norm(r.built.map(x=>x.t).join(' '));const ok=u===norm(r.it.a);if(ok)score++;r.card.classList.add(ok?'ok':'bad');
      r.fb.innerHTML=ok?'<span class="m">\u2713 Đúng.</span>':'<span class="m">\u2717 Chưa đúng.</span> Đáp án: <b>'+r.it.a+'</b>'});return{score,total:st.length}}}
},
write(set){
  const ta=h('textarea',{id:'wr-'+set.id,placeholder:'Viết 3-5 câu tiếng Anh ở đây...','aria-label':'Bài viết của em'});
  const res=h('div'),model=h('div');
  const el=h('div',{class:'items'},h('div',{class:'q'},h('div',{class:'qb'},h('div',{class:'qt'},'Gợi ý:'),h('ul',{class:'checks',style:'font-weight:600'},set.hints.map(x=>h('li',{},x))),ta,res,model)));
  return{el,check(){
    const text=ta.value.trim();const sents=text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const checks=[
      ['Có ít nhất '+(set.minS||3)+' câu',sents.length>=(set.minS||3)],
      ['Mỗi câu bắt đầu bằng chữ hoa',sents.length>0&&sents.every(s=>/^[A-Z]/.test(s))],
      ['Mỗi câu kết thúc bằng dấu chấm, chấm hỏi hoặc chấm than',sents.length>0&&sents.every(s=>/[.!?]$/.test(s))],
      ['Có dùng từ liên quan đến chủ đề',set.kw.test(text)]];
    res.replaceChildren(h('ul',{class:'checks'},checks.map(([t,ok])=>h('li',{class:ok?'ok':'bad'},(ok?'\u2713 ':'\u2717 ')+t))),h('div',{class:'note'},'Máy chỉ kiểm tra hình thức. Hãy so sánh nội dung với bài mẫu và nhờ thầy cô hoặc bố mẹ đọc giúp.'));
    model.replaceChildren(h('div',{class:'qt'},'Bài mẫu:'),h('div',{class:'model'},set.model,ibtn(set.model,'Nghe bài mẫu')));
    ta.readOnly=true;
    return{score:checks.filter(c=>c[1]).length,total:checks.length}}}
},
mix(set){
  const parts=set.gen();const wrap=h('div');const engs=[];
  parts.forEach((p,i)=>{
    wrap.append(...[h('div',{class:'ins',style:'margin-top:20px'},h('b',{},'Phần '+String.fromCharCode(65+i)+'. '+p.ins),p.vi?h('p',{},p.vi):null),
      p.tip?h('div',{class:'tip',html:p.tip}):null,p.passage?h('div',{class:'passage',html:p.passage}):null,p.say?h('div',{class:'ins'},h('b',{},'Bài nghe'),audioBtns(p.say)):null].filter(Boolean));
    const e=ENGINES[p.kind](p);engs.push(e);wrap.append(e.el)});
  return{el:wrap,check(){let s=0,t=0;engs.forEach(e=>{const r=e.check();s+=r.score;t+=r.total});return{score:s,total:t}}}
},
number(set){
  const pics=shuffle(set.pics.map((e,k)=>({e,n:k+1})));const st=[];
  const playBtn=h('button',{class:'btn',type:'button',html:SPK+'<span>Nghe cả bài</span>'});let playing=false;
  playBtn.onclick=async()=>{if(playing)return;playing=true;playBtn.disabled=true;for(const s of set.sents){await speak(s,.8);await new Promise(r=>setTimeout(r,1300))}playing=false;playBtn.disabled=false};
  const grid=h('div',{class:'pgrid'},pics.map((p,i)=>{
    const s=h('select',{class:'sel2','aria-label':'Số thứ tự của hình '+(i+1)},h('option',{value:''},'số'),...[1,2,3,4].map(n=>h('option',{value:n},n)));
    const fb=fbEl();const card=h('div',{class:'pcard'},h('div',{class:'e'},p.e),s,fb);st.push({p,s,card,fb});return card}));
  return{el:h('div',{},h('div',{class:'actions',style:'margin:0 0 14px'},playBtn),grid,h('div',{class:'note'},'Nghe từng câu theo thứ tự rồi ghi số 1, 2, 3, 4 cho từng hình.')),
    check(){let score=0;st.forEach(r=>{const ok=+r.s.value===r.p.n;if(ok)score++;r.s.classList.add(ok?'ok':'bad');r.card.classList.add(ok?'ok':'bad');r.fb.innerHTML=(ok?'<span class="m">\u2713</span> ':'<span class="m">\u2717</span> Đúng là số '+r.p.n+'. ')+'<i>'+set.sents[r.p.n-1]+'</i>'});return{score,total:st.length}}}
}};


viewHome();
