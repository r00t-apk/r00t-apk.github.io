
window.onerror=function(m,s,l,c,e){try{document.getElementById('bootBody').innerHTML='<div style="color:red;padding:8px">JS ERROR line '+l+': '+m+'</div>'}catch(x){};return false};
const githubUsername='r00t-apk';

// ===== SETTINGS =====
let settings={matrix:true,particles:true,scanlines:true,sound:true,ripple:true,trail:false};
function loadSettings(){try{const d=JSON.parse(localStorage.getItem('r00t_settings'));if(d)Object.assign(settings,d)}catch(e){}}
function saveSettings(){try{localStorage.setItem('r00t_settings',JSON.stringify(settings))}catch(e){}}
function toggleSetting(k,el){
  settings[k]=!settings[k];el.classList.toggle('on',settings[k]);saveSettings();
  if(k==='matrix')document.getElementById('matrixCanvas').style.display=settings[k]?'':'none';
  if(k==='particles')document.getElementById('particles').style.display=settings[k]?'':'none';
  if(k==='scanlines')document.getElementById('scanlines').style.display=settings[k]?'':'none';
  if(k==='trail')initTrail(settings[k]);
}
function applySettings(){
  document.getElementById('matrixCanvas').style.display=settings.matrix?'':'none';
  document.getElementById('particles').style.display=settings.particles?'':'none';
  document.getElementById('scanlines').style.display=settings.scanlines?'':'none';
  document.getElementById('togMatrix').classList.toggle('on',settings.matrix);
  document.getElementById('togParticles').classList.toggle('on',settings.particles);
  document.getElementById('togScanlines').classList.toggle('on',settings.scanlines);
  document.getElementById('togSound').classList.toggle('on',settings.sound);
  document.getElementById('togRipple').classList.toggle('on',settings.ripple);
  document.getElementById('togTrail').classList.toggle('on',settings.trail);
  initTrail(settings.trail);
}

// ===== STATE =====
let state={xp:0,level:1,defeated:[],inventory:[],achievements:[],clicks:0,ngPlusCount:0,purchases:[],streak:0};
const SAVE_KEY='r00t_state';
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch(e){}}
function loadState(){try{const d=JSON.parse(localStorage.getItem(SAVE_KEY));if(d)Object.assign(state,d)}catch(e){}}
loadSettings();loadState();

// ===== XP =====
function addXP(amt){
  const total=Math.round(amt*(1+getStreakBonus()+getShopBonus('xpmult'))*(1+combo*.15));
  state.xp+=total;
  const need=state.level*100;
  while(state.xp>=need){state.xp-=need;state.level++;showToast('LEVEL UP!','Level '+state.level)}
  save();updateHUD();showXPFloat(total);
}
function showXPFloat(a){const e=document.createElement('div');e.className='xp-float';e.textContent='+'+a+' XP';e.style.left=(Math.random()*50+25)+'%';e.style.top='35%';document.body.appendChild(e);setTimeout(()=>e.remove(),900)}
function updateHUD(){
  const n=state.level*100,p=(state.xp/n)*100;
  const l=document.getElementById('sbLvl'),b=document.getElementById('sbXpBar'),t=document.getElementById('sbXpTxt');
  if(l)l.textContent=state.level;if(b)b.style.width=p+'%';if(t)t.textContent=state.xp+'/'+n;
  const sb=document.getElementById('statBosses'),sx=document.getElementById('statXP'),sa=document.getElementById('statAch'),ss=document.getElementById('statStreak');
  if(sb)sb.textContent=state.defeated.length;
  if(sx)sx.textContent=state.xp;
  if(sa)sa.textContent=state.achievements.length;
  if(ss)ss.textContent=state.streak;
  // Git panel
  const gl=document.getElementById('gitLevel'),gx=document.getElementById('gitXP'),gb=document.getElementById('gitBosses'),gs=document.getElementById('gitStreak'),gc=document.getElementById('gitClicks'),gf=document.getElementById('gitFiles');
  if(gl)gl.textContent=state.level;if(gx)gx.textContent=state.xp;if(gb)gb.textContent=state.defeated.length;
  if(gs)gs.textContent=state.streak;if(gc)gc.textContent=state.clicks;if(gf)gf.textContent=visitedFiles.length;
  updateGitBadge();renderAchievements();renderShop();
}
function updateHP(){const e=document.getElementById('sbHp');if(!e)return;const eff=playerMaxHP+getShopBonus('maxhp'),p=Math.max(0,(playerHP/eff)*100);e.textContent='HP '+playerHP+'/'+eff;e.style.color=p>50?'#4ec9b0':p>25?'#ce9178':'#f87171'}

// ===== ACHIEVEMENTS =====
const ACH={first_blood:{n:'FIRST BLOOD',d:'Defeat your first boss',i:'⚔️'},veteran:{n:'VETERAN',d:'Reach level 5',i:'🏅'},champion:{n:'CHAMPION',d:'Defeat all bosses',i:'🏆'},explorer:{n:'EXPLORER',d:'Visit every file',i:'🗺️'},persistent:{n:'PERSISTENT',d:'Visit 10+ times',i:'📅'},clickmaster:{n:'CLICK MASTER',d:'Click 100 times',i:'🖱️'},speedrun:{n:'SPEEDRUN',d:'Fight 3 bosses in 10s',i:'⚡'},rich:{n:'RICH',d:'Earn 500+ XP',i:'💰'},social:{n:'SOCIAL',d:'Visit contact page',i:'💌'},terminal:{n:'HACKER',d:'Use 5 terminal commands',i:'💻'}};
function unlock(id){if(state.achievements.includes(id))return;state.achievements.push(id);save();const a=ACH[id];if(a){showToast('ACHIEVEMENT',a.n);sfxAchievement()}}
function updateGitBadge(){const b=document.getElementById('gitBadge');const un=Object.keys(ACH).length-state.achievements.length;if(un>0){b.style.display='flex';b.textContent=un}else b.style.display='none'}
function renderAchievements(){const el=document.getElementById('achList');if(!el)return;el.innerHTML=Object.entries(ACH).map(([id,a])=>{const u=state.achievements.includes(id);return'<div class="git-ach-item '+(u?'unlocked':'locked')+'"><div class="git-ach-icon">'+a.i+'</div><div><div class="git-ach-name">'+a.n+'</div><div class="git-ach-desc">'+a.d+'</div></div></div>'}).join('')}

// ===== SHOP =====
const SHOP=[{id:'dmg2',n:'Power Strike',d:'+15 ATK damage',i:'⚔️',p:80},{id:'heal',n:'Heal Potion',d:'+10 Max HP',i:'❤️',p:60},{id:'shield',n:'Shield',d:'+25 Max HP',i:'🛡️',p:120},{id:'crit3',n:'Crit Chance',d:'15% crit chance',i:'🎯',p:150},{id:'xpboost',n:'XP Boost',d:'+25% XP gain',i:'✨',p:200},{id:'thorns',n:'Thorns',d:'Reflect 8 damage',i:'🌵',p:100}];
function renderShop(){const el=document.getElementById('shopList');if(!el)return;el.innerHTML=SHOP.map(s=>{const owned=state.purchases.includes(s.id);const can=state.xp>=s.p&&!owned;return'<div class="shop-item" onclick="buyItem(\''+s.id+'\')"><div class="shop-icon" style="background:'+(owned?'rgba(78,203,176,.12)':'rgba(167,139,250,.1)')+'">'+s.i+'</div><div class="shop-info"><div class="shop-name">'+s.n+'</div><div class="shop-desc">'+s.d+'</div></div><div class="shop-price '+(owned?'owned':can?'':'cant')+'">'+(owned?'OWNED':s.p+' XP')+'</div></div>'}).join('')}
function buyItem(id){const item=SHOP.find(s=>s.id===id);if(!item||state.purchases.includes(id)||state.xp<item.p)return;state.xp-=item.p;state.purchases.push(id);save();updateHUD();showToast('PURCHASED',item.n);sfxHit()}

// ===== STREAK =====
function getStreakBonus(){const s=state.streak;if(s>=15)return .5;if(s>=10)return .4;if(s>=7)return .3;if(s>=3)return .2;if(s>=2)return .1;return 0}
function initStreak(){try{const l=localStorage.getItem('r00t_last_visit'),sv=parseInt(localStorage.getItem('r00t_streak')||'0',10),t=new Date().toDateString();if(l===t)return;const y=new Date(Date.now()-864e5).toDateString();state.streak=(l===y)?sv+1:1;localStorage.setItem('r00t_last_visit',t);localStorage.setItem('r00t_streak',state.streak);if(state.streak>1)showToast('STREAK!',state.streak+' day streak!');addXP(10+state.streak*5)}catch(e){}}
let visits=parseInt(localStorage.getItem('r00t_visits')||'0',10)+1;localStorage.setItem('r00t_visits',visits);
if(visits>=10)setTimeout(()=>unlock('persistent'),500);

// ===== COMBO =====
let combo=0,comboTimer=null;
function updateComboDisplay(){const b=document.getElementById('comboBar'),x=document.getElementById('comboX'),c=document.getElementById('comboBonus');if(!b)return;if(combo>0){b.classList.add('show');x.textContent=combo+'x';c.textContent='+'+Math.round(combo*15)+'%'}else b.classList.remove('show')}
function resetCombo(){combo=0;updateComboDisplay()}
function incrementCombo(){combo++;updateComboDisplay();clearTimeout(comboTimer);comboTimer=setTimeout(resetCombo,5000)}

// ===== PLAYER HP =====
const playerMaxHP=100;let playerHP=playerMaxHP;
function getShopBonus(t){const m={dmg2:'dmg',heal:'heal',shield:'maxhp',crit3:'crit',xpboost:'xpmult',thorns:'reflect'},v={dmg2:15,heal:10,shield:25,crit3:.15,xpboost:.25,thorns:8};let s=0;state.purchases.forEach(id=>{if(m[id]===t)s+=v[id]});return s}

// ===== SFX =====
let audioCtx=null;
function initAudio(){if(!audioCtx)try{audioCtx=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
function playTone(freq,dur,type,vol){
  if(!settings.sound)return;
  try{initAudio();const o=audioCtx.createOscillator(),g=audioCtx.createGain();
  o.type=type||'square';o.frequency.setValueAtTime(freq,audioCtx.currentTime);
  g.gain.setValueAtTime(vol||.05,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
  o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch(e){}
}
function sfxHit(){playTone(200,.1,'square',.04)}
function sfxDefeat(){playTone(880,.15,'sine',.05);setTimeout(()=>playTone(1100,.2,'sine',.05),100)}
function sfxLevelUp(){playTone(523,.15,'sine',.04);setTimeout(()=>playTone(659,.15,'sine',.04),120);setTimeout(()=>playTone(784,.2,'sine',.04),240)}
function sfxAchievement(){playTone(440,.1,'triangle',.03);setTimeout(()=>playTone(554,.1,'triangle',.03),80);setTimeout(()=>playTone(659,.15,'triangle',.03),160)}
function sfxClick(){playTone(900,.04,'sine',.02)}

// ===== TOAST =====
function showToast(t,m){const c=document.getElementById('toast'),e=document.createElement('div');e.className='toast-item';e.innerHTML='<div class="tt">'+t+'</div><div class="tm">'+m+'</div>';c.appendChild(e);setTimeout(()=>e.remove(),3000)}

// ===== FILE NAVIGATION =====
const extMap={home:'home.tsx',about:'about.tsx',projects:'projects.tsx',terminal:'terminal.tsx',skills:'skills.json',career:'career.yaml',contact:'contact.css','3d':'3d-model.glb',resume:'resume.pdf'};
const fileNames={home:'home.tsx',about:'about.tsx',projects:'projects.tsx',terminal:'terminal.tsx',skills:'skills.json',career:'career.yaml',contact:'contact.css','3d':'3d-model.glb',resume:'resume.pdf'};
let visitedFiles=[];
function openFile(id){
  sfxClick();
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  const sec=document.getElementById('sec-'+id);if(sec)sec.classList.add('active');
  document.querySelectorAll('.file-item').forEach(f=>f.classList.toggle('active',f.dataset.file===id));
  document.getElementById('breadFile').textContent=extMap[id]||id;
  document.getElementById('sbStatus').textContent=(extMap[id]||id).toUpperCase();
  document.querySelector('.editor-scroll').scrollTop=0;
  // Update breadcrumb cursor
  document.querySelectorAll('.bread-cursor').forEach(c=>c.remove());
  const bc=document.querySelector('.breadcrumb');if(bc){const cur=document.createElement('span');cur.className='bread-cursor';bc.appendChild(cur)}
  if(id==='projects')loadProjects();
  if(id==='skills')renderSkillBars();
  if(id==='terminal')initTerminal();
  if(id==='3d'){var cvs=document.getElementById('jetCanvas'),scn=document.getElementById('jetScene');if(cvs&&scn){var w=scn.clientWidth||700,h=scn.clientHeight||540;cvs.width=w*2;cvs.height=h*2;cvs.style.width=w+'px';cvs.style.height=h+'px'}}
  if(id==='contact')unlock('social');
  if(id==='terminal')termCmdCount=0;
  if(!visitedFiles.includes(id)){visitedFiles.push(id);if(visitedFiles.length>=6)unlock('explorer');addXP(15)}
  updateHUD();
}

// ===== SEARCH =====
function renderSearchResults(){const el=document.getElementById('searchResults');if(!el)return;const files=[{n:'home.tsx',id:'home',p:'src/'},{n:'about.tsx',id:'about',p:'src/'},{n:'projects.tsx',id:'projects',p:'src/'},{n:'terminal.tsx',id:'terminal',p:'src/'},{n:'skills.json',id:'skills',p:'src/'},{n:'career.yaml',id:'career',p:'src/'},{n:'contact.css',id:'contact',p:'src/'},{n:'3d-model.glb',id:'3d',p:'src/assets/'},{n:'resume.pdf',id:'resume',p:'src/'}];
  el.innerHTML=files.map(f=>'<div class="search-result" onclick="openFile(\''+f.id+'\')"><span class="sr-icon">'+(f.id==='3d'?'🚙':'📄')+'</span><span class="sr-name">'+f.n+'</span><span class="sr-path">'+f.p+f.n+'</span></div>').join('')}
function filterSearch(q){const el=document.getElementById('searchResults');if(!el)return;const files=[{n:'home.tsx',id:'home',p:'src/'},{n:'about.tsx',id:'about',p:'src/'},{n:'projects.tsx',id:'projects',p:'src/'},{n:'terminal.tsx',id:'terminal',p:'src/'},{n:'skills.json',id:'skills',p:'src/'},{n:'career.yaml',id:'career',p:'src/'},{n:'contact.css',id:'contact',p:'src/'},{n:'3d-model.glb',id:'3d',p:'src/assets/'},{n:'resume.pdf',id:'resume',p:'src/'}];
  const f=q.toLowerCase();const res=files.filter(x=>x.n.includes(f)||x.id.includes(f));
  el.innerHTML=res.length?res.map(x=>'<div class="search-result" onclick="openFile(\''+x.id+'\')"><span class="sr-icon">📄</span><span class="sr-name">'+x.n+'</span><span class="sr-path">'+x.p+x.n+'</span></div>').join(''):'<div style="padding:16px;color:var(--fg3);font-size:12px;text-align:center">No results found</div>'}

// ===== SIDEBAR PANELS =====
function switchPanel(id){
  sfxClick();
  document.querySelectorAll('.sidebar-icon').forEach(i=>i.classList.toggle('active',i.dataset.panel===id));
  document.querySelectorAll('.sidebar-panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+id));
  if(id==='search')setTimeout(()=>document.getElementById('searchInput').focus(),100);
  if(id==='git')updateHUD();
  if(id==='extensions')renderShop();
  if(id==='settings')applySettings();
  if(id==='explorer')renderSearchResults();
}

// ===== PROJECTS =====
let bosses={},totalBosses=0,projectsLoaded=false;
function loadProjects(){
  if(projectsLoaded)return;projectsLoaded=true;
  fetch('https://api.github.com/users/'+githubUsername+'/repos?sort=updated&per_page=30')
  .then(r=>r.json()).then(repos=>{
    if(!Array.isArray(repos)||!repos.length){document.getElementById('bossLoading').textContent='No repos found.';return}
    document.getElementById('bossLoading').remove();
    const grid=document.getElementById('projectGrid');
    repos.forEach((repo,idx)=>{
      const id='boss_'+idx,hp=50+(repo.stargazers_count||0)*10+(repo.forks_count||0)*5;
      bosses[id]={hp,max:hp,project:repo};totalBosses++;
      const def=state.defeated.includes(id);
      const card=document.createElement('div');card.className='project-card';card.dataset.id=id;
      card.innerHTML='<div class="card-head"><h3>'+repo.name+'</h3><span class="stars">★ '+(repo.stargazers_count||0)+'</span></div><p class="desc">'+(repo.description||'A GitHub project by R00T.')+'</p><div class="tags">'+(repo.topics||[]).slice(0,4).map(t=>'<span>'+t+'</span>').join('')+'</div><div class="hp-row"><div class="hp-track"><div class="hp-fill" id="'+id+'hp" style="width:'+(def?0:100)+'%;background:'+(def?'var(--fg2)':'var(--green)')+'"></div></div><div class="hp-info"><span id="'+id+'hptxt">'+(def?0:hp+'/'+hp)+'</span><span>'+(def?'DEFEATED':'HP')+'</span></div></div><div class="card-btns"><button class="btn btn-accent btn-sm" onclick="fightBoss(\''+id+'\')">'+(def?'DEFEATED':'FIGHT')+'</button><button class="btn btn-ghost btn-sm" onclick="viewProject('+idx+')">VIEW</button></div>';
      grid.appendChild(card);
    });
    updateHUD();
  }).catch(()=>{document.getElementById('bossLoading').textContent='Failed to load repos.'});
}
let fightTimestamps=[];
function fightBoss(id){
  const boss=bosses[id];if(!boss)return;
  const dmg=15+Math.floor(Math.random()*10)+getShopBonus('dmg');
  const crit=Math.random()<getShopBonus('crit');
  const finalDmg=crit?dmg*2:dmg;
  boss.hp=Math.max(0,boss.hp-finalDmg);
  const fill=document.getElementById(id+'hp'),txt=document.getElementById(id+'hptxt');
  if(fill)fill.style.width=(boss.hp/boss.max*100)+'%';
  if(txt)txt.textContent=boss.hp+'/'+boss.max;
  sfxHit();incrementCombo();
  if(boss.hp<=0){
    if(!state.defeated.includes(id)){state.defeated.push(id);save()}
    const r=50+boss.max;addXP(r);
    if(state.defeated.length===1)unlock('first_blood');
    if(state.level>=5)unlock('veteran');
    if(state.defeated.length>=totalBosses&&totalBosses>0)unlock('champion');
    showToast('BOSS DEFEATED!','+'+r+' XP'+(crit?' (CRIT!)':''));
    if(fill)fill.style.background='var(--fg2)';
    const card=document.querySelector('[data-id="'+id+'"]');
    if(card){const btn=card.querySelector('.btn-accent');if(btn)btn.textContent='DEFEATED'}
    // Speedrun check
    const now=Date.now();fightTimestamps.push(now);
    fightTimestamps=fightTimestamps.filter(t=>now-t<10000);
    if(fightTimestamps.length>=3)unlock('speedrun');
  }
  if(state.xp>=500)unlock('rich');
  const bd=5+Math.floor(Math.random()*10);playerHP=Math.max(0,playerHP-bd);updateHP();
  if(playerHP<=0){showToast('YOU DIED','Respawning...');setTimeout(()=>{playerHP=playerMaxHP;updateHP()},1500)}
}
function viewProject(idx){
  fetch('https://api.github.com/users/'+githubUsername+'/repos?sort=updated&per_page=30')
  .then(r=>r.json()).then(repos=>{const repo=repos[idx];if(!repo)return;
    document.getElementById('modalContent').innerHTML='<h2>'+repo.name+'</h2><p>'+(repo.description||'No description.')+'</p><div style="display:flex;gap:14px;margin:14px 0;font-size:12px;color:var(--fg2)"><span>★ '+(repo.stargazers_count||0)+'</span><span>⑂ '+(repo.forks_count||0)+'</span><span>'+(repo.language||'N/A')+'</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+(repo.topics||[]).map(t=>'<span style="padding:4px 10px;background:rgba(167,139,250,.12);color:var(--accent);border-radius:5px;font-size:11px">'+t+'</span>').join('')+'</div><div style="display:flex;gap:10px"><a href="'+repo.html_url+'" target="_blank" class="btn btn-accent btn-sm">GitHub</a>'+(repo.homepage?'<a href="'+repo.homepage+'" target="_blank" class="btn btn-ghost btn-sm">Demo</a>':'')+'<button onclick="closeModal()" class="btn btn-ghost btn-sm">Close</button></div>';
    document.getElementById('modal').classList.add('show');
  });
}
function closeModal(){document.getElementById('modal').classList.remove('show')}

// ===== SKILLS =====
const SKILLS=[{n:'Java',p:85},{n:'Selenium / Cucumber BDD',p:80},{n:'Cypress / JavaScript',p:75},{n:'HTML / CSS',p:85},{n:'C# / Unity 3D',p:70},{n:'Git / CI/CD',p:75},{n:'Postman / API',p:70},{n:'Debugging',p:80}];
function renderSkillBars(){const el=document.getElementById('skillBars');if(!el)return;el.innerHTML=SKILLS.map((s,i)=>'<div class="skill-card"><div class="sname">'+s.n+'</div><div class="strack"><div class="sfill" id="sf'+i+'" style="width:0"></div></div><div class="spct">'+s.p+'%</div></div>').join('');
  setTimeout(()=>{SKILLS.forEach((s,i)=>{const f=document.getElementById('sf'+i);if(f)f.style.width=s.p+'%'})},100);
  const ctx=document.getElementById('skillsCanvas');if(ctx&&!ctx.dataset.done){ctx.dataset.done='1';new Chart(ctx,{type:'doughnut',data:{labels:SKILLS.map(s=>s.n),datasets:[{data:SKILLS.map(s=>s.p),backgroundColor:['#a78bfa','#4ec9b0','#569cd6','#c586c0','#ce9178','#dcdcaa','#f87171','#4ec9b0'],borderWidth:0}]},options:{responsive:true,plugins:{legend:{position:'bottom',labels:{color:'#858585',font:{family:'JetBrains Mono',size:11}}}},cutout:'65%'}})}}

// ===== TERMINAL =====
let termInit=false,termCmdCount=0;
function initTerminal(){const out=document.getElementById('termOutput'),inp=document.getElementById('termInput');if(!out||!inp||termInit)return;termInit=true;
  out.innerHTML='<div class="out">Welcome to R00T\'s terminal. Type <span class="cmd">help</span> to begin.</div>';
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){const c=inp.value.trim().toLowerCase();inp.value='';out.innerHTML+='<div class="cmd">$ '+c+'</div>';procCmd(c);out.scrollTop=out.scrollHeight}});inp.focus();
}
function procCmd(c){const out=document.getElementById('termOutput');let r='';termCmdCount++;if(termCmdCount>=5)unlock('terminal');
  switch(c){
    case'help':r='Commands: help, whois, skills, xp, level, social, resume, achievements, shop, age, 3d, clear';break;
    case'whois':r='R00T — 16yo QA Automation Engineer & VR Developer.';break;
    case'skills':r='Java 85% | Selenium/Cucumber 80% | Cypress/JS 75% | HTML/CSS 85% | C#/Unity3D 70% | Postman 70%';break;
    case'xp':r='XP: '+state.xp+'/'+(state.level*100)+' | Level: '+state.level;break;
    case'level':r='Level '+state.level+'. '+((state.level*100)-state.xp)+' XP to next.';break;
    case'social':r='GitHub: r00t-apk | Discord: ngf.r00t | Email: devkpatel50@gmail.com';break;
    case'resume':getResume();r='Downloading...';break;
    case'achievements':r='Unlocked: '+state.achievements.length+'/'+Object.keys(ACH).length;break;
    case'shop':r='XP: '+state.xp+' | Purchased: '+state.purchases.length+' items';break;
    case'age':r='R00T is 16 years old. Based in London, UK.';break;
    case'3d':r='Open 3d-model.glb in the sidebar for an interactive 3D offroad scene!';break;
    case'clear':out.innerHTML='';return;
    case'':return;
    default:r='Unknown command. Type "help".'}
  out.innerHTML+='<div class="out">'+r+'</div>'}

function getResume(){showToast('RESUME','Generating download...')}
function handleContact(e){e.preventDefault();showToast('MESSAGE SENT','Thanks!');e.target.reset()}

// ===== CURSOR TRAIL =====
let trailDots=[];
function initTrail(on){
  trailDots.forEach(d=>d.remove());trailDots=[];
  if(!on)return;
  for(let i=0;i<5;i++){const d=document.createElement('div');d.className='trail-dot';d.style.opacity=0;document.body.appendChild(d);trailDots.push(d)}
  document.addEventListener('mousemove',moveTrail);
}
function moveTrail(e){
  trailDots.forEach((d,i)=>{
    setTimeout(()=>{
      d.style.left=(e.clientX-3)+'px';d.style.top=(e.clientY-3)+'px';
      d.style.opacity=0.6-i*0.12;d.style.transform='scale('+(1-i*0.15)+')';
      setTimeout(()=>d.style.opacity=0,100);
    },i*40);
  });
}

// ===== VFX: MATRIX RAIN =====
try{
(function(){
  var c=document.getElementById('matrixCanvas');
  if(!c)return;
  var ctx=c.getContext('2d');
  if(!ctx)return;
  var cols,drops;
  function resize(){c.width=innerWidth;c.height=innerHeight;cols=Math.floor(c.width/14);drops=Array(cols).fill(1)}
  resize();addEventListener('resize',resize);
  var chars='アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF'.split('');
  function draw(){ctx.fillStyle='rgba(26,26,26,0.06)';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#a78bfa';ctx.font='13px JetBrains Mono';
    for(var i=0;i<cols;i++){ctx.fillText(chars[Math.floor(Math.random()*chars.length)],i*14,drops[i]*14);if(drops[i]*14>c.height&&Math.random()>.975)drops[i]=0;drops[i]++}
    requestAnimationFrame(draw)}draw();
})();
}catch(e){console.error('Matrix rain error:',e)}

// ===== VFX: FLOATING PARTICLES =====
try{
(function(){
  var el=document.getElementById('particles');
  if(!el)return;
  for(var i=0;i<25;i++){
    var p=document.createElement('div');p.className='particle';
    var size=2+Math.random()*4;p.style.width=size+'px';p.style.height=size+'px';
    p.style.background=['var(--accent)','var(--green)','var(--pink)','var(--blue)'][Math.floor(Math.random()*4)];
    p.style.left=Math.random()*100+'%';
    p.style.animationDuration=(10+Math.random()*15)+'s';
    p.style.animationDelay=Math.random()*12+'s';
    el.appendChild(p);
  }
})();
}catch(e){console.error('Particles error:',e)}

// ===== VFX: CLICK RIPPLE =====
try{
document.addEventListener('click',function(e){
  if(!settings.ripple)return;
  var r=document.createElement('div');r.className='ripple';
  r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';
  document.body.appendChild(r);setTimeout(function(){r.remove()},600);
});
}catch(e){console.error('Ripple error:',e)}

// ===== VFX: SCREEN SHAKE =====
function screenShake(){var a=document.getElementById('app');if(a){a.classList.add('shake');setTimeout(function(){a.classList.remove('shake')},350)}}

// ===== VFX: DEFEAT EXPLOSION =====
function defeatExplosion(x,y){
  var colors=['#a78bfa','#f87171','#4ec9b0','#fbbf24','#fff','#c586c0'];
  for(var i=0;i<16;i++){
    var p=document.createElement('div');p.className='defeat-particle';
    p.style.left=x+'px';p.style.top=y+'px';p.style.background=colors[i%colors.length];
    var a=(i/16)*Math.PI*2,d=70+Math.random()*100;
    p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');
    document.body.appendChild(p);setTimeout(function(){p.remove()},700);
  }
}

// ===== VFX: LEVEL UP FLASH =====
function levelUpFlash(){
  var f=document.getElementById('levelFlash');if(!f)return;
  f.innerHTML='<div class="ring"></div>';
  f.classList.add('on');setTimeout(function(){f.classList.remove('on');f.innerHTML=''},600);
}

// ===== VFX: SCROLL PROGRESS =====
try{
var es=document.querySelector('.editor-scroll');
if(es)es.addEventListener('scroll',function(){
  var el=this,p=document.getElementById('scrollProgress');
  var pct=el.scrollTop/(el.scrollHeight-el.clientHeight||1)*100;
  p.style.width=pct+'%';
});
}catch(e){console.error('Scroll progress error:',e)}

// ===== 3D SCENE: FORMATION FLIGHT =====
(function(){
  var scene=document.getElementById('jetScene');
  if(!scene)return;
  var canvas=document.getElementById('jetCanvas');
  if(!canvas)return;
  var ctx=canvas.getContext('2d');
  if(!ctx)return;
  var speedLines=document.getElementById('speedLines');

  var time=0;
  var particles=[];
  var thrust=.3;
  var camY=.35,camX=-.15;
  var dragCY=.35,dragCX=-.15;
  var dragging=false,lastX=0,lastY=0;
  var gridScroll=0;

  function resize(){
    var w=scene.clientWidth||700;
    var h=scene.clientHeight||540;
    if(canvas.width!==w*2||canvas.height!==h*2){
      canvas.width=w*2;canvas.height=h*2;
      canvas.style.width=w+'px';canvas.style.height=h+'px';
    }
  }
  resize();
  setTimeout(resize,200);
  window.addEventListener('resize',resize);

  function rY(v,a){var c=Math.cos(a),s=Math.sin(a);return[c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]];}
  function rX(v,a){var c=Math.cos(a),s=Math.sin(a);return[v[0],c*v[1]-s*v[2],s*v[1]+c*v[2]];}
  function rZ(v,a){var c=Math.cos(a),s=Math.sin(a);return[c*v[0]-s*v[1],s*v[0]+c*v[1],v[2]];}
  function pj(v,cx,cy,sc){var z=v[2]+8;var f=sc/(z<.5?0.5:z);return[cx+v[0]*f,cy-v[1]*f,f];}

  function buildJet(){
    var V2=[],E2=[];
    var vi2=0;
    function addRing(x,rY2,rZ2,n){
      var s=vi2;
      for(var i=0;i<n;i++){
        var a=(i/n)*Math.PI*2;
        V2.push([x,rY2*Math.cos(a),rZ2*Math.sin(a)]);
        if(i<n-1)E2.push([vi2,vi2+1]);
        vi2++;
      }
      E2.push([vi2-1,s]);
      return s;
    }
    var N=12;
    var rings2=[];
    var profile=[
      [-7,0,0],[-6,.06,.08],[-5,.16,.2],[-4,.28,.34],[-3,.4,.46],
      [-2,.5,.56],[-1,.58,.62],[0,.62,.64],[1,.58,.6],[2,.52,.54],
      [3,.44,.46],[4,.36,.38],[5,.28,.3],[6,.2,.22],[7,.12,.14],[7.8,.06,.06]
    ];
    for(var pi=0;pi<profile.length;pi++)rings2.push(addRing(profile[pi][0],profile[pi][1],profile[pi][2],N));
    for(var i=0;i<rings2.length-1;i++){
      for(var j=0;j<N;j++)E2.push([rings2[i]+j,rings2[i+1]+j]);
    }
    var ri5=rings2[5],ri6=rings2[6],ri7=rings2[7],ri8=rings2[8],ri9=rings2[9],ri10=rings2[10],ri11=rings2[11],ri12=rings2[12];
    var wL=[
      [V2[ri7][0]+.3,.6,.7],[V2[ri7][0]+2.2,.1,3.2],[V2[ri7][0]+4,-.04,4],
      [V2[ri7][0]-.05,.58,3.2],[V2[ri7][0]+1,-.08,3.8],[V2[ri8][0]+.4,.58,2.8],
      [V2[ri9][0]+.1,.54,2.2],[V2[ri10][0],.5,1.5]
    ];
    var wLi=vi2;wL.forEach(function(v){V2.push(v);vi2++;});
    E2.push([wLi,wLi+1],[wLi+1,wLi+2],[wLi+2,wLi+3],[wLi+3,wLi+4],[wLi+4,wLi+5],[wLi+5,wLi+6],[wLi+6,wLi+7],[wLi+7,wLi]);
    E2.push([wLi,wLi+5],[wLi+1,wLi+4],[wLi+2,wLi+3]);
    E2.push([wLi,ri7+3]);E2.push([wLi+5,ri8+3]);E2.push([wLi+6,ri9+3]);
    var wR=wL.map(function(v){return[v[0],v[1],-v[2]]});
    var wRi=vi2;wR.forEach(function(v){V2.push(v);vi2++;});
    E2.push([wRi,wRi+1],[wRi+1,wRi+2],[wRi+2,wRi+3],[wRi+3,wRi+4],[wRi+4,wRi+5],[wRi+5,wRi+6],[wRi+6,wRi+7],[wRi+7,wRi]);
    E2.push([wRi,wRi+5],[wRi+1,wRi+4],[wRi+2,wRi+3]);
    E2.push([wRi,ri7+9]);E2.push([wRi+5,ri8+9]);E2.push([wRi+6,ri9+9]);
    var vt=[[V2[ri12][0]-.7,.4,.42],[V2[ri12][0]+.5,.4,.42],[V2[ri12][0]+.4,2.4,.44],[V2[ri12][0]-.5,2.2,.42],[V2[ri12][0]-.05,2.6,.43]];
    var vti=vi2;vt.forEach(function(v){V2.push(v);vi2++;});
    E2.push([vti,vti+1],[vti+1,vti+2],[vti+2,vti+4],[vti+4,vti+3],[vti+3,vti]);
    E2.push([vti,ri12+3]);E2.push([vti+1,ri12+4]);
    var hsL=[[V2[ri12][0]+.2,.42,.44],[V2[ri12][0]+1.3,.36,2],[V2[ri12][0]-.4,.4,1.7]];
    var hsLi=vi2;hsL.forEach(function(v){V2.push(v);vi2++;});
    E2.push([hsLi,hsLi+1],[hsLi+1,hsLi+2],[hsLi+2,hsLi]);E2.push([hsLi,ri12+3]);
    var hsR=hsL.map(function(v){return[v[0],v[1],-v[2]]});
    var hsRi=vi2;hsR.forEach(function(v){V2.push(v);vi2++;});
    E2.push([hsRi,hsRi+1],[hsRi+1,hsRi+2],[hsRi+2,hsRi]);E2.push([hsRi,ri12+9]);
    var ck=[[V2[ri5][0]+.15,.5,.32],[V2[ri5][0]+.15,.5,-.32],[V2[ri9][0],.56,.3],[V2[ri9][0],.56,-.3],[V2[ri7][0]+.4,1.1,0]];
    var cki=vi2;ck.forEach(function(v){V2.push(v);vi2++;});
    E2.push([cki,cki+2],[cki+2,cki+4],[cki+4,cki+3],[cki+3,cki+1],[cki+1,cki]);
    E2.push([cki,cki+4],[cki+1,cki+4]);E2.push([cki+2,cki+4],[cki+3,cki+4]);
    E2.push([cki,cki+1],[cki+2,cki+3]);
    return{V:V2,E:E2,rings:rings2,N:N,wLi:wLi,wRi:wRi,exhaustRing:rings2[rings2.length-1]};
  }

  var jetModel=buildJet();

  var formation=[
    {x:0,y:0,z:0,color:'rgba(56,189,248,A)',scale:1,roll:0,pitch:0,exhaust:.3},
    {x:-2.2,y:.8,z:-1.5,color:'rgba(96,180,255,A)',scale:.85,roll:0,pitch:0,exhaust:.25},
    {x:2.2,y:.8,z:-1.5,color:'rgba(96,180,255,A)',scale:.85,roll:0,pitch:0,exhaust:.25},
    {x:-1.5,y:-.6,z:-3,color:'rgba(120,160,255,A)',scale:.75,roll:0,pitch:0,exhaust:.2},
    {x:1.5,y:-.6,z:-3,color:'rgba(120,160,255,A)',scale:.75,roll:0,pitch:0,exhaust:.2}
  ];

  var basePositions=formation.map(function(f){return{x:f.x,y:f.y,z:f.z};});

  function drawGrid(w,h,cx,cy,sc){
    var gridTop=cy+sc*.35;
    var gridBot=h*.95;
    ctx.save();
    for(var i=0;i<=35;i++){
      var t=i/35;
      var y=gridTop+t*t*(gridBot-gridTop);
      var alpha=.015+t*.1;
      ctx.strokeStyle='rgba(56,189,248,'+alpha.toFixed(3)+')';
      ctx.lineWidth=t<.05?0.5:1+t*1.2;
      var spread=.06+t*.94;
      ctx.beginPath();ctx.moveTo(cx-w*spread*.5,y);ctx.lineTo(cx+w*spread*.5,y);ctx.stroke();
    }
    for(var i=-30;i<=30;i++){
      var baseX=i*(w/30);
      var alpha=.04*(1-Math.abs(i)/30*.8);
      ctx.strokeStyle='rgba(56,189,248,'+alpha.toFixed(3)+')';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(cx+baseX*.25,gridTop);ctx.lineTo(cx+baseX*1.2,gridBot);ctx.stroke();
    }
    ctx.restore();
  }

  function drawJetWireframe(f,cx,cy,sc){
    var jm=jetModel;
    var tv=[];
    for(var i=0;i<jm.V.length;i++){
      var v=jm.V[i];
      var p=rZ(v,f.roll);
      p=rX(p,f.pitch);
      p=rY(p,0);
      p=[p[0]*f.scale+f.x,p[1]*f.scale+f.y,p[2]*f.scale+f.z];
      tv.push(p);
    }
    var sc2=sc*.4;
    for(var i=0;i<jm.E.length;i++){
      var e=jm.E[i];
      if(e[0]>=tv.length||e[1]>=tv.length)continue;
      var p0=pj(tv[e[0]],cx,cy,sc2);
      var p1=pj(tv[e[1]],cx,cy,sc2);
      var az=(tv[e[0]][2]+tv[e[1]][2])/2;
      var df=Math.max(.25,Math.min(1,1-az*.03));
      ctx.strokeStyle=f.color.replace('A',(df*.8).toFixed(2));
      ctx.lineWidth=Math.max(.6,1.8-az*.05);
      ctx.beginPath();ctx.moveTo(p0[0],p0[1]);ctx.lineTo(p1[0],p1[1]);ctx.stroke();
    }
    var ei=jm.exhaustRing+Math.floor(jm.N/2);
    var ep=pj(tv[ei],cx,cy,sc2);
    return{ex:ep,f:f};
  }

  function drawExhaust(cx,cy,ex,ey,intensity){
    if(intensity<.04)return;
    var cSz=5+intensity*15;
    var oSz=12+intensity*30;
    var cg=ctx.createRadialGradient(ex,ey,0,ex,ey,cSz);
    cg.addColorStop(0,'rgba(255,255,255,'+(0.7*intensity).toFixed(2)+')');
    cg.addColorStop(.3,'rgba(120,200,255,'+(0.5*intensity).toFixed(2)+')');
    cg.addColorStop(.7,'rgba(56,189,248,'+(0.2*intensity).toFixed(2)+')');
    cg.addColorStop(1,'transparent');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(ex,ey,cSz,0,Math.PI*2);ctx.fill();
    var og=ctx.createRadialGradient(ex,ey,0,ex,ey,oSz);
    og.addColorStop(0,'rgba(56,189,248,'+(0.08*intensity).toFixed(2)+')');
    og.addColorStop(1,'transparent');
    ctx.fillStyle=og;ctx.beginPath();ctx.arc(ex,ey,oSz,0,Math.PI*2);ctx.fill();
    var pc=Math.floor(intensity*3);
    for(var i=0;i<pc;i++){
      spawnParticle(ex+Math.random()*5,ey+(Math.random()-.5)*3,.8+Math.random()*2*intensity,(Math.random()-.5)*.6,8+Math.random()*10,Math.random()>.3?'rgba(255,255,255,A)':'rgba(56,189,248,A)');
    }
  }

  function spawnParticle(x,y,vx,vy,life,color){
    particles.push({x:x,y:y,vx:vx,vy:vy,life:life,maxLife:life,color:color});
  }

  function drawParticles(){
    for(var i=particles.length-1;i>=0;i--){
      var p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.life--;
      p.vy+=.008;
      if(p.life<=0){particles.splice(i,1);continue;}
      var alpha=p.life/p.maxLife;
      ctx.fillStyle=p.color.replace('A',alpha.toFixed(2));
      ctx.beginPath();ctx.arc(p.x,p.y,.8*alpha+.3,0,Math.PI*2);ctx.fill();
    }
  }

  var hudStats=document.getElementById('hudStats');
  var hudMode=document.getElementById('hudMode');
  var hudGForce=document.getElementById('hudGForce');
  var hudHeading=document.getElementById('hudHeading');

  scene.addEventListener('mousedown',function(e){dragging=true;lastX=e.clientX;lastY=e.clientY;scene.style.cursor='grabbing';});
  document.addEventListener('mousemove',function(e){
    if(!dragging)return;
    dragCY+=(e.clientX-lastX)*.004;dragCX+=(e.clientY-lastY)*.004;
    dragCX=Math.max(-.8,Math.min(.4,dragCX));
    lastX=e.clientX;lastY=e.clientY;
  });
  document.addEventListener('mouseup',function(){if(dragging){dragging=false;scene.style.cursor='grab';}});
  scene.addEventListener('touchstart',function(e){lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;});
  scene.addEventListener('touchmove',function(e){e.preventDefault();var t=e.touches[0];dragCY+=(t.clientX-lastX)*.004;dragCX+=(t.clientY-lastY)*.004;dragCX=Math.max(-.8,Math.min(.4,dragCX));lastX=t.clientX;lastY=t.clientY;},{passive:false});

  scene.addEventListener('click',function(){
    thrust=1;
    for(var i=0;i<10;i++){
      (function(idx){
        setTimeout(function(){
          var l=document.createElement('div');l.className='speed-line';
          l.style.top=(10+Math.random()*80)+'%';l.style.width=(100+Math.random()*300)+'px';
          l.style.animationDuration=(.12+Math.random()*.12)+'s';
          speedLines.appendChild(l);setTimeout(function(){l.remove();},300);
        },idx*20);
      })(i);
    }
  });

  function animate(){
    try{
    time++;
    var w=canvas.width,h=canvas.height;
    if(w<10||h<10){requestAnimationFrame(animate);return;}
    var cx=w/2,cy=h*.42;
    var sc=Math.min(w,h)*.42;

    thrust+=(.3-thrust)*.03;
    gridScroll+=2+thrust*3;

    camY+=(dragCY-camY)*.05;
    camX+=(dragCX-camX)*.05;

    var bank=Math.sin(time*.02)*.015;
    var bob=Math.sin(time*.035)*.04;

    for(var fi=0;fi<formation.length;fi++){
      var f=formation[fi];
      var bp=basePositions[fi];
      f.x=bp.x+Math.sin(time*.025+fi*.5)*.08;
      f.y=bp.y+bob*(fi===0?1:.7)+Math.sin(time*.03+fi*.8)*.03;
      f.roll=bank*(fi===0?1:.6)+Math.sin(time*.02+fi)*.01;
      f.pitch=Math.sin(time*.03+fi*.5)*.02;
      f.exhaust=fi===0?(.3+thrust*.7):(.2+thrust*.4);
    }

    ctx.clearRect(0,0,w,h);

    var ag=ctx.createRadialGradient(cx,cy-sc*.1,0,cx,cy-sc*.1,sc*1.4);
    ag.addColorStop(0,'rgba(56,189,248,.02)');ag.addColorStop(1,'transparent');
    ctx.fillStyle=ag;ctx.beginPath();ctx.arc(cx,cy-sc*.1,sc*1.4,0,Math.PI*2);ctx.fill();

    drawGrid(w,h,cx,cy,sc);

    var sorted=formation.slice().sort(function(a,b){return b.z-a.z;});
    var exhausts=[];
    for(var fi=0;fi<sorted.length;fi++){
      var result=drawJetWireframe(sorted[fi],cx,cy,sc);
      exhausts.push(result);
    }

    for(var ei=0;ei<exhausts.length;ei++){
      var ex=exhausts[ei];
      drawExhaust(cx,cy,ex.ex[0],ex.ex[1],ex.f.exhaust);
    }

    drawParticles();

    if(thrust>.4&&Math.random()<thrust*.5){
      var l=document.createElement('div');l.className='speed-line';
      l.style.top=(5+Math.random()*90)+'%';l.style.width=(80+Math.random()*250)+'px';
      l.style.animationDuration=(.08+Math.random()*.08)+'s';
      speedLines.appendChild(l);setTimeout(function(){l.remove();},200);
    }
    if(thrust>.35)speedLines.classList.add('active');
    else speedLines.classList.remove('active');

    var spd=Math.round(320+thrust*200);
    var hdg=Math.round(((camY)*180/Math.PI%360+360)%360);

    if(hudStats)hudStats.textContent='SPD: '+spd+' · ALT: '+(35000+Math.round(Math.sin(time*.008)*500)).toLocaleString();
    if(hudMode){
      if(thrust>.8)hudMode.textContent='MODE: AFTERBURNER';
      else hudMode.textContent='MODE: FORMATION';
    }
    if(hudGForce)hudGForce.textContent='JETS: '+formation.length;
    if(hudHeading)hudHeading.textContent='HDG: '+String(hdg).padStart(3,'0');

    requestAnimationFrame(animate);
    }catch(err){console.error('Animate error:',err);requestAnimationFrame(animate)}
  }
  animate();
})();

// ===== VFX: HOOK INTO GAME FUNCTIONS =====
try{
var _origFightBoss=fightBoss;
fightBoss=function(id){
  var boss=bosses[id];var wasAlive=boss&&boss.hp>0;
  _origFightBoss(id);
  if(wasAlive){
    sfxHit();screenShake();
    var card=document.querySelector('[data-id="'+id+'"]');
    if(card){card.classList.add('hit-flash');setTimeout(function(){card.classList.remove('hit-flash')},150)}
    if(boss&&boss.hp<=0){
      sfxDefeat();screenShake();
      var r=card.getBoundingClientRect();
      defeatExplosion(r.left+r.width/2,r.top+r.height/2);
    }
  }
};

var _origAddXP=addXP;
addXP=function(amt){
  var prev=state.level;
  _origAddXP(amt);
  if(state.level>prev){sfxLevelUp();levelUpFlash()}
};

var _origUnlock=unlock;
unlock=function(id){
  var had=state.achievements.includes(id);
  _origUnlock(id);
  if(!had)sfxAchievement();
};
}catch(e){console.error('VFX hooks error:',e)}

// ===== BOOT SEQUENCE =====
(function(){
  const lines=[
    {t:'<span class="ok">[OK]</span> Initializing environment...',d:200},
    {t:'<span class="ok">[OK]</span> Loading JetBrains Mono font...',d:300},
    {t:'<span class="ok">[OK]</span> Compiling VS Code layout...',d:250},
    {t:'<span class="ok">[OK]</span> Fetching GitHub repos...',d:350},
    {t:'<span class="ok">[OK]</span> Setting up XP system...',d:200},
    {t:'<span class="ok">[OK]</span> Initializing terminal...',d:200},
    {t:'<span class="ok">[OK]</span> Loading achievements engine...',d:180},
    {t:'<span class="ok">[OK]</span> Activating VFX modules...',d:220},
    {t:'<span class="ok">[OK]</span> Compiling shop items...',d:180},
    {t:'<span class="hi">[SYS]</span> R00T portfolio ready. Welcome.',d:300}
  ];
  const body=document.getElementById('bootBody'),status=document.getElementById('bootStatus'),bar=document.getElementById('bootProgressBar');
  let delay=200;
  lines.forEach((l,i)=>{
    setTimeout(()=>{const e=document.createElement('div');e.className='boot-line';e.innerHTML=l.t;body.appendChild(e);requestAnimationFrame(()=>e.classList.add('on'));status.textContent='loading ('+(i+1)+'/'+lines.length+')';bar.style.width=((i+1)/lines.length*100)+'%'},delay);
    delay+=l.d;
  });
  setTimeout(()=>{status.textContent='ready';bar.style.width='100%';setTimeout(()=>{
    document.getElementById('boot').classList.add('done');
    document.getElementById('app').classList.add('show');
    updateHUD();updateHP();initStreak();applySettings();renderSearchResults();
  },400)},delay+200);
})();

document.addEventListener('click',()=>{state.clicks++;if(state.clicks>=100)unlock('clickmaster')});
updateHUD();updateHP();
