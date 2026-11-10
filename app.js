'use strict';
/* Arena Codex v2 — mọi dữ liệu từ data.txt; render bằng DOM API (không innerHTML). */
const $=(s,r=document)=>r.querySelector(s);
const h=(t,a={},...k)=>{const e=document.createElement(t);for(const[n,v]of Object.entries(a)){if(v==null||v===false)continue;if(n==='class')e.className=v;else if(n.startsWith('on'))e.addEventListener(n.slice(2),v);else e.setAttribute(n,v===true?'':v)}for(const c of k.flat())if(c!=null&&c!==false)e.append(c.nodeType?c:document.createTextNode(c));return e};
const norm=s=>Array.from(String(s??'')).map(c=>(c.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d')[0]||'')).join('').toLowerCase();
const GROUPS=[['role','Vai trò'],['lane','Lộ'],['damage','Sát thương'],['difficulty','Độ khó'],['range','Tầm đánh'],['status','Trạng thái']];
const ORDER={role:['Tank','Fighter','Assassin','Mage','Marksman','Support'],lane:['Top','Mid','Jungle','Bot','Support'],damage:['Physical','Magic','Mixed','True Damage'],difficulty:['Easy','Normal','Hard','Expert'],range:['Melee','Ranged'],status:['New','Updated']};
const IMG=/^[\w-]+\.(png|jpe?g|webp|gif|svg)$/i,PAGE=24;
const S={chars:[],err:[],warn:[],bad:new Set(),f:Object.fromEntries(GROUPS.map(([k])=>[k,new Set()])),q:'',sort:'id',shown:PAGE};
const vals=(c,k)=>k==='lane'?c.lane:(c[k]?[c[k]]:[]);

/* ---------- Nạp + kiểm tra ---------- */
function ingest(d){
  if(!d||!Array.isArray(d.characters))throw new Error('data.txt cần có dạng {"characters":[ ... ]}');
  const seen=new Set();
  d.characters.forEach((c,i)=>{
    const t=c&&c.id?'#'+c.id:'mục '+(i+1),e=m=>S.err.push(t+': '+m),w=m=>S.warn.push(t+': '+m);
    if(!c||typeof c!=='object'||Array.isArray(c))return e('không phải khối { }');
    c.id=String(c.id??'');if(!/^[\w-]+$/.test(c.id))return e('thiếu hoặc sai id (chỉ chữ, số, _ và -)');
    if(seen.has(c.id))return e('id bị trùng');
    if(!c.name||!c.role)return e('thiếu name hoặc role');
    seen.add(c.id);c.lane=c.lane?[].concat(c.lane):[];c.images=c.images&&typeof c.images==='object'?c.images:{};
    for(const[k,v]of Object.entries(c.images))if(!IMG.test(v)){w('ảnh "'+k+'" sai tên file, đã bỏ qua');delete c.images[k]}
    c.skills=(Array.isArray(c.skills)?c.skills:[]).filter(s=>s&&s.name);
    c.skills.forEach(s=>{if(s.icon&&!IMG.test(s.icon)){w('icon kỹ năng "'+s.name+'" sai tên file');delete s.icon}});
    if(c.skills.length!==4)w('cần 4 kỹ năng (1 bị động + 3 chiêu), hiện có '+c.skills.length);
    c.story=[].concat(c.story||[]).map(String);
    c._s=norm([c.id,c.name,c.title,c.role,c.lane.join(' '),c.damage,c.difficulty,c.range,c.intro,c.skills.map(s=>s.name+' '+(s.desc||'')).join(' '),c.story.join(' ')].filter(Boolean).join(' '));
    S.chars.push(c);
  });
}

/* ---------- Tô màu: số = vàng, "Khống chế" = xanh dương, (x1) = xanh ngọc ---------- */
const KW='sát thương vật lý|sát thương phép|sát thương chuẩn|công vật lý|công phép|máu tối đa|máu đã mất|máu hiện tại|hồi máu|lá chắn|kháng phép|giáp|máu|năng lượng';
const RX=new RegExp('"([^"]+)"|(\\(x\\d+(?:[.,]\\d+)?\\))|(\\d+(?:[.,]\\d+)?(?:\\s*[-–/]\\s*\\d+(?:[.,]\\d+)?)*(?:\\s*(?:%|giây|s|m)(?![\\p{L}]))?)|(?:'+KW+')(?![\\p{L}])','giu');
function rich(s){
  const f=document.createDocumentFragment();s=String(s??'');let l=0,m;RX.lastIndex=0;
  while((m=RX.exec(s))){if(m.index>l)f.append(s.slice(l,m.index));f.append(h('span',{class:m[1]?'cc':m[2]?'mp':'v'},m[1]||m[0]));l=RX.lastIndex}
  if(l<s.length)f.append(s.slice(l));return f;
}

/* ---------- Thành phần ---------- */
const initials=n=>n.split(/\s+/).slice(-2).map(w=>w[0]).join('').toUpperCase();
function pic(p,alt,zoom,fbText){
  const fb=()=>h('div',{class:'fb',role:'img','aria-label':'Chưa có ảnh: '+alt},fbText);
  if(!p)return fb();
  const im=h('img',{src:p,alt,loading:'lazy',decoding:'async',onerror(ev){S.bad.add(alt+': '+p);(ev.target.closest('.zoom')||ev.target).replaceWith(fb())}});
  return zoom?h('button',{type:'button',class:'zoom','aria-label':'Phóng to: '+alt,onclick(e){e.preventDefault();e.stopPropagation();preview(p,alt)}},im):im;
}
function hl(text,q){const t=norm(q).trim();if(!t||!text)return text||'';const i=norm(text).indexOf(t);return i<0?text:[text.slice(0,i),h('mark',{},text.slice(i,i+t.length)),text.slice(i+t.length)]}
const card=(c,q='')=>h('a',{class:'card',href:'#/c/'+encodeURIComponent(c.id)},
  h('div',{class:'ph'},pic(c.images.avatar,c.name,false,initials(c.name)),c.status&&h('span',{class:'tag'},c.status)),
  h('div',{class:'cb'},h('small',{},[c.role,...c.lane].join(' / ')),h('h3',{},hl(c.name,q)),c.title&&h('p',{},hl(c.title,q))));

/* ---------- Tìm kiếm / lọc ---------- */
function result(){
  const t=norm(S.q).split(/\s+/).filter(Boolean),s=S.sort;
  const r=S.chars.filter(c=>GROUPS.every(([k])=>!S.f[k].size||vals(c,k).some(v=>S.f[k].has(v)))&&t.every(x=>c._s.includes(x)));
  r.sort(s==='name'?(a,b)=>a.name.localeCompare(b.name,'vi'):s==='role'?(a,b)=>a.role.localeCompare(b.role)||a.name.localeCompare(b.name,'vi'):(a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
  return r;
}
function buildFilters(){
  const box=$('#filters-body');box.replaceChildren();
  for(const[k,label]of GROUPS){
    const cnt=new Map();S.chars.forEach(c=>vals(c,k).forEach(v=>cnt.set(v,(cnt.get(v)||0)+1)));if(!cnt.size)continue;
    const o=ORDER[k]||[],rank=v=>{const i=o.indexOf(v);return i<0?99:i};
    box.append(h('fieldset',{class:'fg'},h('legend',{},label),h('div',{class:'chips'},[...cnt].sort((a,b)=>rank(a[0])-rank(b[0])||String(a[0]).localeCompare(b[0],'vi')).map(([v,n])=>h('button',{type:'button',class:'chip','data-k':k,'data-v':v,'aria-pressed':'false',onclick(){const s=S.f[k];s.has(v)?s.delete(v):s.add(v);S.shown=PAGE;renderList()}},v,h('small',{},n))))));
  }
}
function renderList(){
  const r=result(),n=GROUPS.reduce((a,[k])=>a+S.f[k].size,0);
  document.querySelectorAll('.chip[data-k]').forEach(b=>b.setAttribute('aria-pressed',String(S.f[b.dataset.k].has(b.dataset.v))));
  $('#fcount').hidden=!n;$('#fcount').textContent=n;$('#count').textContent=r.length+' / '+S.chars.length+' nhân vật';
  $('#grid').replaceChildren(...r.slice(0,S.shown).map(c=>card(c,S.q)));$('#empty').hidden=r.length>0;$('#btn-more').hidden=r.length<=S.shown;
}
function clearAll(){GROUPS.forEach(([k])=>S.f[k].clear());S.q='';$('#q').value='';S.shown=PAGE;renderList()}
function toggleFilters(o){$('#filters').classList.toggle('open',o);$('#backdrop').hidden=!o}

/* ---------- Trang ---------- */
function renderHome(){
  const ch=S.chars,f=ch.find(c=>c.status==='New')||ch[0],bg=f&&(f.images.splash||f.images.bg||f.images.avatar),hb=$('#hero-bg');
  hb.replaceChildren(...(bg?[h('img',{src:bg,alt:'',onerror(e){e.target.remove()}})]:[]));
  $('#hero-n').textContent=ch.length+' nhân vật trong thư viện';
  const nw=ch.filter(c=>c.status);$('#featured').replaceChildren(...(nw.length?nw:ch).slice(0,4).map(c=>card(c)));
  const roles=new Map();ch.forEach(c=>roles.set(c.role,(roles.get(c.role)||0)+1));
  $('#role-groups').replaceChildren(...[...roles].map(([r,n])=>h('button',{type:'button',class:'chip',onclick(){clearAll();S.f.role.add(r);go('characters')}},r,h('small',{},n))));
}
function preview(src,alt){$('#lb-img').src=src;$('#lb-img').alt=alt;$('#lb').hidden=false;$('#lb-x').focus()}
function closePreview(){$('#lb').hidden=true;$('#lb-img').removeAttribute('src')}
function skillsNode(c){
  const sk=c.skills,det=h('div',{class:'sd','aria-live':'polite'}),row=h('div',{class:'srow',role:'tablist','aria-label':'Kỹ năng'});
  const key=(s,i)=>s.key||(i?String(i):'Bị động'),badge=(s,i)=>{const k=key(s,i);return k.length>2?'✦':k};
  const show=i=>{[...row.children].forEach((b,j)=>b.setAttribute('aria-selected',String(i===j)));const s=sk[i];
    det.replaceChildren(h('div',{class:'sk-h'},h('em',{},key(s,i)),h('h3',{},s.name)),s.desc&&h('p',{class:'rt'},rich(s.desc)),(s.cd||s.cost)&&h('div',{class:'sk-m'},s.cd&&h('span',{},'Hồi chiêu: ',rich(s.cd)),s.cost&&h('span',{},'Tiêu hao: ',rich(s.cost))))};
  sk.forEach((s,i)=>row.append(h('button',{type:'button',role:'tab',class:'sbtn','aria-label':s.name,onclick:()=>show(i),onkeydown(e){if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const n=(i+(e.key==='ArrowRight'?1:sk.length-1))%sk.length;show(n);row.children[n].focus()}}},pic(s.icon,s.name,false,badge(s,i)),h('b',{},badge(s,i)))));
  show(0);return h('div',{},h('h2',{},'Kỹ năng'),row,det);
}
function storyNode(c){
  const body=h('div',{class:'lbody'},c.story.map(l=>/^#\s/.test(l)?h('h4',{},l.replace(/^#\s+/,'')):h('p',{},l))),w=h('div',{class:'lore'},body);
  if(body.textContent.length>900){body.classList.add('clamp');const b=h('button',{type:'button',class:'btn ghost','aria-expanded':'false',onclick(){const on=body.classList.toggle('clamp');b.textContent=on?'Đọc tiếp':'Thu gọn';b.setAttribute('aria-expanded',String(!on))}},'Đọc tiếp');w.append(b)}
  return h('section',{class:'wrap lore-s'},h('h2',{},'Cốt truyện'),w);
}
function renderProfile(id){
  const v=$('#v-profile'),c=S.chars.find(x=>x.id===id);v.replaceChildren();
  if(!c){v.append(h('div',{class:'wrap'},h('div',{class:'empty'},h('h3',{},'Không có nhân vật #'+id),h('a',{class:'btn',href:'#/characters'},'Về thư viện'))));return}
  document.title=c.name+' — Arena Codex';
  const bg=c.images.splash||c.images.bg;
  v.append(h('div',{class:'ph-hero'},bg&&h('img',{class:'bgimg',src:bg,alt:'',onerror(e){S.bad.add(bg);e.target.remove()}}),
    h('div',{class:'wrap pin'},h('div',{class:'pav'},pic(c.images.avatar,c.name,true,initials(c.name))),h('div',{},h('h1',{},c.name),c.title&&h('p',{class:'ct'},c.title),
      h('div',{class:'meta'},[c.role,...c.lane,c.damage,c.difficulty,c.range].filter(Boolean).map(x=>h('span',{},x))),c.intro&&h('p',{class:'intro'},c.intro)))));
  const st=Object.entries(c.stats||{}),ov=h('div',{class:'wrap ov'});
  if(st.length)ov.append(h('div',{class:'stats-col'},h('h2',{},'Chỉ số'),h('dl',{class:'stats-l'},st.flatMap(([k,x])=>[h('dt',{},k),h('dd',{},rich(x))]))));
  if(c.skills.length)ov.append(skillsNode(c));
  v.append(ov);if(c.story.length)v.append(storyNode(c));
}
function renderReport(){
  const box=$('#report');box.replaceChildren(h('p',{},'Đã nạp '+S.chars.length+' nhân vật hợp lệ.'));
  const list=(t,a,cls)=>box.append(h('h3',{},t+' ('+a.length+')'),a.length?h('ul',{class:'rep'},a.map(x=>h('li',{class:cls},x))):h('p',{class:'muted'},'Không có.'));
  list('Lỗi (nhân vật bị loại)',S.err,'e');list('Cảnh báo',S.warn,'');list('Ảnh không tải được (kiểm tra tên file trong repo)',[...S.bad],'');
}
/* Cài đặt */
const DEF={fs:'normal',rm:false},CFG={...DEF};
function loadCfg(){try{const o=JSON.parse(localStorage.getItem('arena.cfg')||'{}');if(['normal','large'].includes(o.fs))CFG.fs=o.fs;if(typeof o.rm==='boolean')CFG.rm=o.rm}catch{}}
function saveCfg(){try{localStorage.setItem('arena.cfg',JSON.stringify(CFG))}catch{}applyCfg()}
function applyCfg(){document.documentElement.dataset.fs=CFG.fs;document.documentElement.classList.toggle('rm',CFG.rm)}
function renderSettings(){
  const box=$('#settings'),grp=(l,k,o)=>h('fieldset',{class:'fg'},h('legend',{},l),h('div',{class:'chips'},o.map(([v,t])=>h('button',{type:'button',class:'chip','aria-pressed':String(CFG[k]===v),onclick(){CFG[k]=v;saveCfg();renderSettings()}},t))));
  box.replaceChildren(grp('Cỡ chữ','fs',[['normal','Vừa'],['large','Lớn']]),grp('Giảm chuyển động','rm',[[false,'Theo hệ thống'],[true,'Luôn giảm']]),h('button',{class:'btn ghost',type:'button',onclick(){Object.assign(CFG,DEF);saveCfg();renderSettings()}},'Khôi phục mặc định'));
}

/* ---------- Điều hướng ---------- */
const go=r=>{location.hash='#/'+r};
function route(){
  if(!S.ready)return;
  const hs=location.hash||'#/home',m=hs.match(/^#\/c\/(.+)$/),view=m?'profile':({'#/characters':'characters','#/database':'database','#/settings':'settings'})[hs]||'home';
  document.querySelectorAll('.view').forEach(s=>s.hidden=s.id!=='v-'+view);
  document.querySelectorAll('[data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===view));
  document.title='Arena Codex — Bách khoa nhân vật MOBA';toggleFilters(false);
  if(view==='characters')renderList();if(view==='profile')renderProfile(decodeURIComponent(m[1]));if(view==='database')renderReport();if(view==='settings')renderSettings();
  scrollTo(0,0);
}
function focusSearch(){if(location.hash!=='#/characters')go('characters');setTimeout(()=>$('#q').focus(),60)}
async function init(){
  loadCfg();applyCfg();
  $('#grid').replaceChildren(...Array.from({length:8},()=>h('div',{class:'sk'})));
  let t=null;
  $('#q').addEventListener('input',e=>{clearTimeout(t);t=setTimeout(()=>{S.q=e.target.value;S.shown=PAGE;renderList()},200)});
  $('#sort').addEventListener('change',e=>{S.sort=e.target.value;renderList()});
  $('#btn-more').addEventListener('click',()=>{S.shown+=PAGE;renderList()});
  $('#btn-clear').addEventListener('click',clearAll);$('#btn-empty-clear').addEventListener('click',clearAll);
  $('#btn-filter').addEventListener('click',()=>toggleFilters(true));
  for(const id of['btn-fclose','btn-fdone','backdrop'])$('#'+id).addEventListener('click',()=>toggleFilters(false));
  $('#btn-search').addEventListener('click',focusSearch);$('#bn-search').addEventListener('click',focusSearch);
  $('#hero-form').addEventListener('submit',e=>{e.preventDefault();clearAll();S.q=$('#hero-q').value;$('#q').value=S.q;go('characters')});
  addEventListener('hashchange',route);
  $('#lb-x').addEventListener('click',closePreview);$('#lb').addEventListener('click',e=>{if(e.target.id==='lb')closePreview()});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePreview();toggleFilters(false)}});
  try{
    const r=await fetch('data.txt',{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status+' khi tải data.txt');
    let d;try{d=JSON.parse(await r.text())}catch(e){throw new Error('JSON không hợp lệ: '+e.message)}
    ingest(d);buildFilters();renderHome();S.ready=true;route();
  }catch(e){document.querySelectorAll('.view').forEach(s=>s.hidden=s.id!=='v-error');$('#err-msg').textContent=e.message}
}
if(typeof document!=='undefined')init();
if(typeof module!=='undefined')module.exports={S,norm,ingest,rich};
