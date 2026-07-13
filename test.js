
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
  document.getElementById('statBosses').textContent=state.defeated.length;
  document.getElementById('statXP').textContent=state.xp;
  document.getElementById('statAch').textContent=state.achievements.length;
  document.getElementById('statStreak').textContent=state.streak;
  // Git panel
  const gl=document.getElementById('gitLevel'),gx=document.getElementById('gitXP'),gb=document.getElementById('gitBosses'),gs=document.getElementById('gitStreak'),gc=document.getElementById('gitClicks'),gf=document.getElementById('gitFiles');
  if(gl)gl.textContent=state.level;if(gx)gx.textContent=state.xp;if(gb)gb.textContent=state.defeated.length;
  if(gs)gs.textContent=state.streak;if(gc)gc.textContent=state.clicks;if(gf)gf.textContent=visitedFiles.length;
  updateGitBadge();renderAchievements();renderShop();
}
function updateHP(){const e=document.getElementById('sbHp');if(!e)return;const eff=playerMaxHP+getShopBonus('maxhp'),p=Math.max(0,(playerHP/eff)*100);e.textContent='HP '+playerHP+'/'+eff;e.style.color=p>50?'#4ec9b0':p>25?'#ce9178':'#f87171'}

// ===== ACHIEVEMENTS =====
const ACH={first_blood:{n:'FIRST BLOOD',d:'Defeat your first boss',i:'âš”ï¸'},veteran:{n:'VETERAN',d:'Reach level 5',i:'ðŸ…'},champion:{n:'CHAMPION',d:'Defeat all bosses',i:'ðŸ†'},explorer:{n:'EXPLORER',d:'Visit every file',i:'ðŸ—ºï¸'},persistent:{n:'PERSISTENT',d:'Visit 10+ times',i:'ðŸ“…'},clickmaster:{n:'CLICK MASTER',d:'Click 100 times',i:'ðŸ–±ï¸'},speedrun:{n:'SPEEDRUN',d:'Fight 3 bosses in 10s',i:'âš¡'},rich:{n:'RICH',d:'Earn 500+ XP',i:'ðŸ’°'},social:{n:'SOCIAL',d:'Visit contact page',i:'ðŸ’Œ'},terminal:{n:'HACKER',d:'Use 5 terminal commands',i:'ðŸ’»'}};
function unlock(id){if(state.achievements.includes(id))return;state.achievements.push(id);save();const a=ACH[id];if(a){showToast('ACHIEVEMENT',a.n);sfxAchievement()}}
function updateGitBadge(){const b=document.getElementById('gitBadge');const un=Object.keys(ACH).length-state.achievements.length;if(un>0){b.style.display='flex';b.textContent=un}else b.style.display='none'}
function renderAchievements(){const el=document.getElementById('achList');if(!el)return;el.innerHTML=Object.entries(ACH).map(([id,a])=>{const u=state.achievements.includes(id);return'<div class="git-ach-item '+(u?'unlocked':'locked')+'"><div class="git-ach-icon">'+a.i+'</div><div><div class="git-ach-name">'+a.n+'</div><div class="git-ach-desc">'+a.d+'</div></div></div>'}).join('')}

// ===== SHOP =====
const SHOP=[{id:'dmg2',n:'Power Strike',d:'+15 ATK damage',i:'âš”ï¸',p:80},{id:'heal',n:'Heal Potion',d:'+10 Max HP',i:'â¤ï¸',p:60},{id:'shield',n:'Shield',d:'+25 Max HP',i:'ðŸ›¡ï¸',p:120},{id:'crit3',n:'Crit Chance',d:'15% crit chance',i:'ðŸŽ¯',p:150},{id:'xpboost',n:'XP Boost',d:'+25% XP gain',i:'âœ¨',p:200},{id:'thorns',n:'Thorns',d:'Reflect 8 damage',i:'ðŸŒµ',p:100}];
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
  if(id==='contact')unlock('social');
  if(id==='terminal')termCmdCount=0;
  if(!visitedFiles.includes(id)){visitedFiles.push(id);if(visitedFiles.length>=6)unlock('explorer');addXP(15)}
  updateHUD();
}

// ===== SEARCH =====
function renderSearchResults(){const el=document.getElementById('searchResults');if(!el)return;const files=[{n:'home.tsx',id:'home',p:'src/'},{n:'about.tsx',id:'about',p:'src/'},{n:'projects.tsx',id:'projects',p:'src/'},{n:'terminal.tsx',id:'terminal',p:'src/'},{n:'skills.json',id:'skills',p:'src/'},{n:'career.yaml',id:'career',p:'src/'},{n:'contact.css',id:'contact',p:'src/'},{n:'3d-model.glb',id:'3d',p:'src/assets/'},{n:'resume.pdf',id:'resume',p:'src/'}];
  el.innerHTML=files.map(f=>'<div class="search-result" onclick="openFile(\''+f.id+'\')"><span class="sr-icon">'+(f.id==='3d'?'ðŸš™':'ðŸ“„')+'</span><span class="sr-name">'+f.n+'</span><span class="sr-path">'+f.p+f.n+'</span></div>').join('')}
function filterSearch(q){const el=document.getElementById('searchResults');if(!el)return;const files=[{n:'home.tsx',id:'home',p:'src/'},{n:'about.tsx',id:'about',p:'src/'},{n:'projects.tsx',id:'projects',p:'src/'},{n:'terminal.tsx',id:'terminal',p:'src/'},{n:'skills.json',id:'skills',p:'src/'},{n:'career.yaml',id:'career',p:'src/'},{n:'contact.css',id:'contact',p:'src/'},{n:'3d-model.glb',id:'3d',p:'src/assets/'},{n:'resume.pdf',id:'resume',p:'src/'}];
  const f=q.toLowerCase();const res=files.filter(x=>x.n.includes(f)||x.id.includes(f));
  el.innerHTML=res.length?res.map(x=>'<div class="search-result" onclick="openFile(\''+x.id+'\')"><span class="sr-icon">ðŸ“„</span><span class="sr-name">'+x.n+'</span><span class="sr-path">'+x.p+x.n+'</span></div>').join(''):'<div style="padding:16px;color:var(--fg3);font-size:12px;text-align:center">No results found</div>'}

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
      card.innerHTML='<div class="card-head"><h3>'+repo.name+'</h3><span class="stars">â˜… '+(repo.stargazers_count||0)+'</span></div><p class="desc">'+(repo.description||'A GitHub project by R00T.')+'</p><div class="tags">'+(repo.topics||[]).slice(0,4).map(t=>'<span>'+t+'</span>').join('')+'</div><div class="hp-row"><div class="hp-track"><div class="hp-fill" id="'+id+'hp" style="width:'+(def?0:100)+'%;background:'+(def?'var(--fg2)':'var(--green)')+'"></div></div><div class="hp-info"><span id="'+id+'hptxt">'+(def?0:hp+'/'+hp)+'</span><span>'+(def?'DEFEATED':'HP')+'</span></div></div><div class="card-btns"><button class="btn btn-accent btn-sm" onclick="fightBoss(\''+id+'\')">'+(def?'DEFEATED':'FIGHT')+'</button><button class="btn btn-ghost btn-sm" onclick="viewProject('+idx+')">VIEW</button></div>';
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
  playSfx('hit');incrementCombo();
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
    document.getElementById('modalContent').innerHTML='<h2>'+repo.name+'</h2><p>'+(repo.description||'No description.')+'</p><div style="display:flex;gap:14px;margin:14px 0;font-size:12px;color:var(--fg2)"><span>â˜… '+(repo.stargazers_count||0)+'</span><span>â‘‚ '+(repo.forks_count||0)+'</span><span>'+(repo.language||'N/A')+'</span></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px">'+(repo.topics||[]).map(t=>'<span style="padding:4px 10px;background:rgba(167,139,250,.12);color:var(--accent);border-radius:5px;font-size:11px">'+t+'</span>').join('')+'</div><div style="display:flex;gap:10px"><a href="'+repo.html_url+'" target="_blank" class="btn btn-accent btn-sm">GitHub</a>'+(repo.homepage?'<a href="'+repo.homepage+'" target="_blank" class="btn btn-ghost btn-sm">Demo</a>':'')+'<button onclick="closeModal()" class="btn btn-ghost btn-sm">Close</button></div>';
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
    case'whois':r='R00T â€” 16yo QA Automation Engineer & VR Developer.';break;
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
(function(){
  const c=document.getElementById('matrixCanvas'),ctx=c.getContext('2d');
  let cols,drops;
  function resize(){c.width=innerWidth;c.height=innerHeight;cols=Math.floor(c.width/14);drops=Array(cols).fill(1)}
  resize();addEventListener('resize',resize);
  const chars='ã‚¢ã‚¤ã‚¦ã‚¨ã‚ªã‚«ã‚­ã‚¯ã‚±ã‚³ã‚µã‚·ã‚¹ã‚»ã‚½ã‚¿ãƒãƒ„ãƒ†ãƒˆãƒŠãƒ‹ãƒŒãƒãƒŽãƒãƒ’ãƒ•ãƒ˜ãƒ›ãƒžãƒŸãƒ ãƒ¡ãƒ¢ãƒ¤ãƒ¦ãƒ¨ãƒ©ãƒªãƒ«ãƒ¬ãƒ­ãƒ¯ãƒ²ãƒ³0123456789ABCDEF'.split('');
  function draw(){ctx.fillStyle='rgba(26,26,26,0.06)';ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#a78bfa';ctx.font='13px JetBrains Mono';
    for(let i=0;i<cols;i++){ctx.fillText(chars[Math.floor(Math.random()*chars.length)],i*14,drops[i]*14);if(drops[i]*14>c.height&&Math.random()>.975)drops[i]=0;drops[i]++}
    requestAnimationFrame(draw)}draw();
})();

// ===== VFX: FLOATING PARTICLES =====
(function(){
  const el=document.getElementById('particles');
  for(let i=0;i<25;i++){
    const p=document.createElement('div');p.className='particle';
    const size=2+Math.random()*4;p.style.width=size+'px';p.style.height=size+'px';
    p.style.background=['var(--accent)','var(--green)','var(--pink)','var(--blue)'][Math.floor(Math.random()*4)];
    p.style.left=Math.random()*100+'%';
    p.style.animationDuration=(10+Math.random()*15)+'s';
    p.style.animationDelay=Math.random()*12+'s';
    el.appendChild(p);
  }
})();

// ===== VFX: CLICK RIPPLE =====
document.addEventListener('click',function(e){
  if(!settings.ripple)return;
  const r=document.createElement('div');r.className='ripple';
  r.style.left=e.clientX+'px';r.style.top=e.clientY+'px';
  document.body.appendChild(r);setTimeout(()=>r.remove(),600);
});

// ===== VFX: SCREEN SHAKE =====
function screenShake(){const a=document.getElementById('app');a.classList.add('shake');setTimeout(()=>a.classList.remove('shake'),350)}

// ===== VFX: DEFEAT EXPLOSION =====
function defeatExplosion(x,y){
  const colors=['#a78bfa','#f87171','#4ec9b0','#fbbf24','#fff','#c586c0'];
  for(let i=0;i<16;i++){
    const p=document.createElement('div');p.className='defeat-particle';
    p.style.left=x+'px';p.style.top=y+'px';p.style.background=colors[i%colors.length];
    const a=(i/16)*Math.PI*2,d=70+Math.random()*100;
    p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d+'px');
    document.body.appendChild(p);setTimeout(()=>p.remove(),700);
  }
}

// ===== VFX: LEVEL UP FLASH =====
function levelUpFlash(){
  const f=document.getElementById('levelFlash');f.innerHTML='<div class="ring"></div>';
  f.classList.add('on');setTimeout(()=>{f.classList.remove('on');f.innerHTML=''},600);
}

// ===== VFX: SCROLL PROGRESS =====
document.querySelector('.editor-scroll').addEventListener('scroll',function(){
  const el=this,p=document.getElementById('scrollProgress');
  const pct=el.scrollTop/(el.scrollHeight-el.clientHeight||1)*100;
  p.style.width=pct+'%';
});

// ===== 3D SCENE: FIGHTER JET =====
(function(){
  const scene=document.getElementById('jetScene');
  if(!scene)return;
  const canvas=document.getElementById('jetCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  if(!ctx)return;
  const speedLines=document.getElementById('speedLines');
  const hudStats=document.getElementById('hudStats');
  const hudMode=document.getElementById('hudMode');
  const hudGForce=document.getElementById('hudGForce');
  const hudHeading=document.getElementById('hudHeading');

  let orbitY=.6,orbitX=-.3;
  let dragY=.6,dragX=-.3;
  let dragging=false,lastX=0,lastY=0;
  let speed=0,steer=0,jetRoll=0,jetPitch=0,altitude=35000,heading=90;
  let turbo=false,turboTimer=0;
  let gForce=1,time=0;
  const maxSpeed=6,accel=.15,brakeForce=.22,friction=.012;
  const keys={w:false,s:false,a:false,d:false};
  const particles=[];

  function resize(){
    const w=scene.clientWidth||700;
    const h=scene.clientHeight||540;
    if(canvas.width!==w*2||canvas.height!==h*2){
      canvas.width=w*2;canvas.height=h*2;
      canvas.style.width=w+'px';canvas.style.height=h+'px';
    }
  }
  resize();
  setTimeout(resize,200);
  window.addEventListener('resize',resize);

  function rotY(v,a){const c=Math.cos(a),s=Math.sin(a);return[c*v[0]+s*v[2],v[1],-s*v[0]+c*v[2]];}
  function rotX(v,a){const c=Math.cos(a),s=Math.sin(a);return[v[0],c*v[1]-s*v[2],s*v[1]+c*v[2]];}
  function rotZ(v,a){const c=Math.cos(a),s=Math.sin(a);return[c*v[0]-s*v[1],s*v[0]+c*v[1],v[2]];}
  function proj(v,cx,cy,sc){const z=v[2]+8;const f=sc/(z<.5?0.5:z);return[cx+v[0]*f,cy-v[1]*f,f];}

  const V=[],E=[];
  let vi=0;
  function addRing(x,rY,rZ,n){
    const s=vi;
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2;
      V.push([x,rY*Math.cos(a),rZ*Math.sin(a)]);
      if(i<n-1)E.push([vi,vi+1]);
      vi++;
    }
    E.push([vi-1,s]);
    return s;
  }

  const N=12;
  const rings=[];
  const profile=[
    [-7,0,0],[-6.2,.15,.15],[-5.4,.3,.3],[-4.6,.45,.45],[-3.8,.55,.55],
    [-3,.62,.6],[-2,.68,.65],[-1,.72,.68],[0,.75,.7],[1,.75,.65],
    [2,.72,.6],[3,.68,.55],[4,.62,.5],[5,.55,.45],[6,.45,.4],[7,.35,.35],[7.8,.25,.25]
  ];
  for(const p of profile)rings.push(addRing(p[0],p[1],p[2],N));
  for(let i=0;i<rings.length-1;i++){
    for(let j=0;j<N;j++)E.push([rings[i]+j,rings[i+1]+j]);
  }

  const ri7=rings[7],ri8=rings[8],ri9=rings[9],ri10=rings[10],ri11=rings[11],ri12=rings[12],ri13=rings[13];

  const wL=[
    [V[ri7][0]+.3,.72,.7],[V[ri7][0]+2.5,.15,3.0],[V[ri7][0]+4,-.05,3.8],
    [V[ri7][0]-.2,.65,3.2],[V[ri7][0]+1.2,-.1,3.5],[V[ri8][0]+.5,.7,2.8],
    [V[ri9][0],.65,2.0]
  ];
  const wLi=vi;wL.forEach(v=>{V.push(v);vi++;});
  E.push([wLi,wLi+1],[wLi+1,wLi+2],[wLi+2,wLi+3],[wLi+3,wLi+4],[wLi+4,wLi+5],[wLi+5,wLi+6],[wLi+6,wLi]);
  E.push([wLi,wLi+5],[wLi+1,wLi+4],[wLi+2,wLi+3]);
  E.push([wLi,ri7+3]);E.push([wLi+5,ri8+3]);E.push([wLi+6,ri9+3]);E.push([wLi+3,ri7+3]);E.push([wLi+4,ri8+3]);

  const wR=wL.map(v=>[v[0],v[1],-v[2]]);
  const wRi=vi;wR.forEach(v=>{V.push(v);vi++;});
  E.push([wRi,wRi+1],[wRi+1,wRi+2],[wRi+2,wRi+3],[wRi+3,wRi+4],[wRi+4,wRi+5],[wRi+5,wRi+6],[wRi+6,wRi]);
  E.push([wRi,wRi+5],[wRi+1,wRi+4],[wRi+2,wRi+3]);
  E.push([wRi,ri7+9]);E.push([wRi+5,ri8+9]);E.push([wRi+6,ri9+9]);E.push([wRi+3,ri7+9]);E.push([wRi+4,ri8+9]);

  const vt=[
    [V[ri12][0]-.8,.55,.42],[V[ri12][0]+.6,.55,.42],
    [V[ri12][0]+.4,2.8,.5],[V[ri12][0]-.6,2.6,.48],
    [V[ri12][0]-.1,2.9,.49]
  ];
  const vti=vi;vt.forEach(v=>{V.push(v);vi++;});
  E.push([vti,vti+1],[vti+1,vti+2],[vti+2,vti+4],[vti+4,vti+3],[vti+3,vti]);
  E.push([vti,ri12+3]);E.push([vti+1,ri12+4]);
  E.push([vti+4,vti+2],[vti+4,vti+3]);

  const hsL=[[V[ri12][0]+.2,.52,.48],[V[ri12][0]+1.5,.48,2.2],[V[ri12][0]-.5,.5,1.8]];
  const hsLi=vi;hsL.forEach(v=>{V.push(v);vi++;});
  E.push([hsLi,hsLi+1],[hsLi+1,hsLi+2],[hsLi+2,hsLi]);E.push([hsLi,ri12+3]);

  const hsR=hsL.map(v=>[v[0],v[1],-v[2]]);
  const hsRi=vi;hsR.forEach(v=>{V.push(v);vi++;});
  E.push([hsRi,hsRi+1],[hsRi+1,hsRi+2],[hsRi+2,hsRi]);E.push([hsRi,ri12+9]);

  const ck=[
    [V[ri4][0]+.2,.58,.38],[V[ri4][0]+.2,.58,-.38],
    [V[ri8][0],.62,.35],[V[ri8][0],.62,-.35],
    [V[ri6][0]+.5,1.3,0]
  ];
  const cki=vi;ck.forEach(v=>{V.push(v);vi++;});
  E.push([cki,cki+2],[cki+2,cki+4],[cki+4,cki+3],[cki+3,cki+1],[cki+1,cki]);
  E.push([cki,cki+4],[cki+1,cki+4]);E.push([cki+2,cki+4],[cki+3,cki+4]);
  E.push([cki,cki+1],[cki+2,cki+3]);

  const ai=[[V[ri5][0],-.65,.32],[V[ri5][0],-.65,-.32],[V[ri8][0],-.7,.38],[V[ri8][0],-.7,-.38]];
  const aiLi=vi;ai.forEach(v=>{V.push(v);vi++;});
  E.push([aiLi,aiLi+1],[aiLi+1,aiLi+3],[aiLi+3,aiLi+2],[aiLi+2,aiLi]);
  E.push([aiLi,aiLi+2],[aiLi+1,aiLi+3]);

  function addMissile(zOff){
    const m=[[-.3,0,zOff],[2.2,0,zOff],[2.5,0,zOff]];
    const mi=vi;m.forEach(v=>{V.push(v);vi++;});
    E.push([mi,mi+1],[mi+1,mi+2]);
  }
  addMissile(2.0);addMissile(-2.0);

  function drawGrid(w,h,cx,cy,sc){
    const gridY=cy+sc*.35;
    const gridH=h*.4;
    const lines=30;
    ctx.save();
    for(let i=0;i<=lines;i++){
      const t=i/lines;
      const y=gridY+t*gridH;
      const spread=.15+t*.85;
      const alpha=.04+t*.1;
      ctx.strokeStyle='rgba(3,105,161,'+alpha+')';
      ctx.lineWidth=t<.1?0.5:1;
      ctx.beginPath();ctx.moveTo(cx-w*spread*.5,y);ctx.lineTo(cx+w*spread*.5,y);ctx.stroke();
    }
    for(let i=-25;i<=25;i++){
      const alpha=.02*(1-Math.abs(i)/25*.7);
      ctx.strokeStyle='rgba(3,105,161,'+alpha+')';ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(cx+i*6,gridY);ctx.lineTo(cx+i*14,gridY+gridH);ctx.stroke();
    }
    const grd=ctx.createLinearGradient(0,gridY-15,0,gridY+15);
    grd.addColorStop(0,'transparent');grd.addColorStop(.5,'rgba(3,105,161,.03)');grd.addColorStop(1,'transparent');
    ctx.fillStyle=grd;ctx.fillRect(0,gridY-15,w,30);
    ctx.restore();
  }

  function drawCrosshair(w,h,cx,cy){
    ctx.save();
    ctx.strokeStyle='rgba(3,105,161,.15)';ctx.lineWidth=1;
    const s=20;
    ctx.beginPath();ctx.moveTo(cx-s,cy);ctx.lineTo(cx-6,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+6,cy);ctx.lineTo(cx+s,cy);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy-s);ctx.lineTo(cx,cy-6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx,cy+6);ctx.lineTo(cx,cy+s);ctx.stroke();
    ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }

  function spawnParticle(x,y,vx,vy,life,color){
    particles.push({x,y,vx,vy,life,maxLife:life,color});
  }

  function drawParticles(){
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];
      p.x+=p.vx;p.y+=p.vy;p.life--;
      p.vy+=.02;
      if(p.life<=0){particles.splice(i,1);continue;}
      const alpha=p.life/p.maxLife;
      ctx.fillStyle=p.color.replace('A',alpha.toFixed(2));
      ctx.beginPath();ctx.arc(p.x,p.y,1.5*alpha,0,Math.PI*2);ctx.fill();
    }
  }

  scene.addEventListener('mousedown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;scene.style.cursor='grabbing';});
  document.addEventListener('mousemove',e=>{
    if(!dragging)return;
    dragY+=(e.clientX-lastX)*.005;dragX+=(e.clientY-lastY)*.005;
    dragX=Math.max(-1.2,Math.min(.5,dragX));
    lastX=e.clientX;lastY=e.clientY;
  });
  document.addEventListener('mouseup',()=>{if(dragging){dragging=false;scene.style.cursor='grab';}});
  document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(k in keys)keys[k]=true;});
  document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k in keys)keys[k]=false;});
  scene.addEventListener('touchstart',e=>{lastX=e.touches[0].clientX;lastY=e.touches[0].clientY;});
  scene.addEventListener('touchmove',e=>{e.preventDefault();const t=e.touches[0];dragY+=(t.clientX-lastX)*.005;dragX+=(t.clientY-lastY)*.005;dragX=Math.max(-1.2,Math.min(.5,dragX));lastX=t.clientX;lastY=t.clientY;},{passive:false});

  scene.addEventListener('click',()=>{
    if(Math.abs(speed)<.3)return;
    turbo=true;turboTimer=80;
    scene.classList.add('turbo');
    for(let i=0;i<8;i++){
      setTimeout(()=>{
        const l=document.createElement('div');l.className='speed-line';
        l.style.top=(15+Math.random()*70)+'%';l.style.width=(100+Math.random()*300)+'px';
        l.style.animationDuration=(.2+Math.random()*.2)+'s';
        speedLines.appendChild(l);setTimeout(()=>l.remove(),500);
      },i*30);
    }
  });

  function animate(){
    time++;
    const w=canvas.width,h=canvas.height;
    if(w<10||h<10){requestAnimationFrame(animate);return;}
    const cx=w/2,cy=h*.42;
    const sc=Math.min(w,h)*.3;

    const curMax=turbo?maxSpeed*1.8:maxSpeed;
    if(keys.w)speed=Math.min(speed+accel,curMax);
    else if(keys.s)speed=Math.max(speed-brakeForce,-maxSpeed*.3);
    else speed=Math.abs(speed)<friction?0:speed-(speed>0?friction:-friction);

    if(keys.a)steer=Math.max(steer-.035,-.14);
    else if(keys.d)steer=Math.min(steer+.035,.14);
    else steer*=.88;

    jetRoll+=(steer*speed*.4-jetRoll)*.08;
    jetPitch+=(((keys.w?0.08:0)-(keys.s?0.08:0))-jetPitch)*.06;
    heading=(heading+steer*speed*2+360)%360;
    altitude=Math.max(0,altitude+speed*80);

    const targetG=1+Math.abs(steer)*speed*2;
    gForce+=(targetG-gForce)*.1;

    if(turbo){turboTimer--;if(turboTimer<=0){turbo=false;scene.classList.remove('turbo');}}

    orbitY+=(dragY-orbitY)*.05;
    orbitX+=(dragX-orbitX)*.05;

    ctx.clearRect(0,0,w,h);
    drawGrid(w,h,cx,cy,sc);
    drawCrosshair(w,h,cx,cy);

    ctx.strokeStyle='rgba(3,105,161,.08)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();

    const tv=[];
    const baseRot=heading*0.0174+orbitY;
    for(const v of V){
      let p=rotZ(v,jetRoll);
      p=rotX(p,jetPitch);
      p=rotY(p,baseRot);
      p=rotX(p,orbitX+.12);
      tv.push(p);
    }

    const se=E.slice().sort((a,b)=>{
      const za=(tv[a[0]][2]+tv[a[1]][2])/2;
      const zb=(tv[b[0]][2]+tv[b[1]][2])/2;
      return zb-za;
    });

    for(const e of se){
      if(e[0]>=tv.length||e[1]>=tv.length)continue;
      const p0=proj(tv[e[0]],cx,cy,sc);
      const p1=proj(tv[e[1]],cx,cy,sc);
      const az=(tv[e[0]][2]+tv[e[1]][2])/2;
      const df=Math.max(.3,Math.min(1,1-az*.025));
      const bright=turbo?1.1:1;
      ctx.strokeStyle=`rgba(3,105,161,${(df*.9*bright).toFixed(2)})`;
      ctx.lineWidth=Math.max(1.5,3.5-az*.12);
      ctx.beginPath();ctx.moveTo(p0[0],p0[1]);ctx.lineTo(p1[0],p1[1]);ctx.stroke();
    }

    for(const v of tv){
      const p=proj(v,cx,cy,sc);
      const df=Math.max(.3,Math.min(1,1-v[2]*.025));
      ctx.fillStyle=`rgba(3,105,161,${(df*.65).toFixed(2)})`;
      ctx.beginPath();ctx.arc(p[0],p[1],Math.max(1,2.5-v[2]*.08),0,Math.PI*2);ctx.fill();
    }

    ctx.save();ctx.translate(cx,cy+sc*.4);ctx.scale(1,.2);
    const sg=ctx.createRadialGradient(0,0,0,0,0,sc*.22);
    sg.addColorStop(0,'rgba(3,105,161,.1)');sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg;ctx.beginPath();ctx.arc(0,0,sc*.22,0,Math.PI*2);ctx.fill();
    ctx.restore();

    if(turbo){
      const exhaust=proj(tv[rings[rings.length-1]+Math.floor(N/2)],cx,cy,sc);
      for(let i=0;i<3;i++){
        const eg=ctx.createRadialGradient(exhaust[0]+i*3,exhaust[1],0,exhaust[0]+i*3,exhaust[1],30+i*15);
        eg.addColorStop(0,`rgba(56,189,248,${(.5-i*.12).toFixed(2)})`);
        eg.addColorStop(.5,`rgba(14,165,233,${(.25-i*.06).toFixed(2)})`);
        eg.addColorStop(1,'transparent');
        ctx.fillStyle=eg;ctx.beginPath();ctx.arc(exhaust[0]+i*3,exhaust[1],30+i*15,0,Math.PI*2);ctx.fill();
      }
      const et=proj(tv[rings[rings.length-1]],cx,cy,sc);
      if(Math.random()<.6)spawnParticle(et[0],et[1],3+Math.random()*4,(Math.random()-.5)*2,25+Math.random()*20,'rgba(56,189,248,A)');
      if(Math.random()<.4)spawnParticle(et[0],et[1],2+Math.random()*3,(Math.random()-.5)*3,20+Math.random()*15,'rgba(14,165,233,A)');
    }

    if(speed>2){
      const wtip=proj(tv[wLi+2],cx,cy,sc);
      if(Math.random()<.3)spawnParticle(wtip[0],wtip[1],-speed*.5,(Math.random()-.5),15+Math.random()*10,'rgba(3,105,161,A)');
      const wtip2=proj(tv[wRi+2],cx,cy,sc);
      if(Math.random()<.3)spawnParticle(wtip2[0],wtip2[1],-speed*.5,(Math.random()-.5),15+Math.random()*10,'rgba(3,105,161,A)');
    }

    drawParticles();

    if(Math.abs(speed)>1.5){
      if(Math.random()<.25){
        const l=document.createElement('div');l.className='speed-line';
        l.style.top=(8+Math.random()*84)+'%';l.style.width=(80+Math.random()*280)+'px';
        l.style.animationDuration=(.25+Math.random()*.25)+'s';
        speedLines.appendChild(l);setTimeout(()=>l.remove(),500);
      }
      speedLines.classList.add('active');
    }else speedLines.classList.remove('active');

    if(hudStats){
      const spd=Math.round(Math.abs(speed)*32);
      hudStats.textContent='SPD: '+spd+' Â· ALT: '+Math.round(altitude).toLocaleString();
    }
    if(hudMode){
      if(turbo)hudMode.textContent='MODE: AFTERBURNER';
      else if(Math.abs(speed)>3.5)hudMode.textContent='MODE: FULL THROTTLE';
      else if(Math.abs(speed)>1)hudMode.textContent='MODE: CRUISE';
      else hudMode.textContent='MODE: IDLE';
    }
    if(hudGForce)hudGForce.textContent='G: '+gForce.toFixed(1);
    if(hudHeading)hudHeading.textContent='HDG: '+String(Math.round(heading)).padStart(3,'0');

    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== VFX: HOOK INTO GAME FUNCTIONS =====
const _origFightBoss=fightBoss;
fightBoss=function(id){
  const boss=bosses[id];const wasAlive=boss&&boss.hp>0;
  _origFightBoss(id);
  if(wasAlive){
    sfxHit();screenShake();
    const card=document.querySelector('[data-id="'+id+'"]');
    if(card){card.classList.add('hit-flash');setTimeout(()=>card.classList.remove('hit-flash'),150)}
    if(boss&&boss.hp<=0){
      sfxDefeat();screenShake();
      const r=card.getBoundingClientRect();
      defeatExplosion(r.left+r.width/2,r.top+r.height/2);
    }
  }
};

const _origAddXP=addXP;
addXP=function(amt){
  const prev=state.level;
  _origAddXP(amt);
  if(state.level>prev){sfxLevelUp();levelUpFlash()}
};

const _origUnlock=unlock;
unlock=function(id){
  const had=state.achievements.includes(id);
  _origUnlock(id);
  if(!had)sfxAchievement();
};

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
