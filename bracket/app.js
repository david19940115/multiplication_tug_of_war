const playerNames=["","Tina歐","依芯","Sophie","予祈","立信","Molly","梧海","語豐","Alex","Henry","品誠","睿紘","諺諺"];
const escapeText=text=>String(text).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const rawName=id=>state.names?.[id]||playerNames[id]||'待定';
const playerName=id=>escapeText(rawName(id));
const ids=Array.from({length:13},(_,i)=>i+1),key='multiplication-cup-v4',app=document.querySelector('#app');let state={screen:'home',order:Array(13).fill(null),results:{},qualifiers:{},finals:{}},selected=null,active=null,busy=false;
try{const s=JSON.parse(localStorage.getItem(key));if(s&&Array.isArray(s.order)&&s.order.length===13&&s.results&&s.qualifiers&&s.finals&&['home','setup','board'].includes(s.screen))state=s;}catch{}
const source=id=>`assets/${String(id).padStart(2,'0')}.png`,img=id=>`<img src="${source(id)}" alt="${playerName(id)}選手" data-portrait="${id}" title="長按 2 秒改名" draggable="false">`;
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{notify('目前瀏覽器無法儲存進度')}}
function notify(text){const n=document.querySelector('#notice');const decoded=document.createElement('textarea');decoded.innerHTML=text;n.textContent=decoded.value;n.style.display='block';clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.style.display='none',2600)}
function shuffle(){const a=[...ids];for(let i=12;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function blank(screen,order){return {screen,order,results:{},qualifiers:{},finals:{},names:{...state.names}}}
function person(id){return `<button draggable="true" data-person="${id}" class="person ${selected===id?'selected':''}">${img(id)}<span>${playerName(id)}</span></button>`}
function place(id,index){if(!ids.includes(id))return;const old=state.order.indexOf(id),other=state.order[index];if(old>=0)state.order[old]=other;state.order[index]=id;selected=null;save();render()}
document.querySelector('#reset').onclick=()=>{if(!busy&&(state.screen!=='board'||confirm('清除這次比賽並重新分配？'))){state=blank('home',Array(13).fill(null));active=null;save();render()}};
function setup(random){state=blank('setup',random?shuffle():Array(13).fill(null));selected=null;save();render()}
function roundLabel(g,i){return g.size===4?i%2+1:i+1}
function setQualifier(group,player){if(state.qualifiers[group]===player)return;if(player)state.qualifiers[group]=player;else delete state.qualifiers[group];delete state.finals[group==='A'||group==='B'?'S1':'S2'];delete state.finals.F;}
function shape(g,editing){const s=Cup.summary(state,g),q=state.qualifiers[g.name];return `<section class="group"><h2>${g.name} 組<span>${g.size} 人 · ${g.size} 場</span></h2><div class="shape"><svg aria-hidden="true">${g.points.map((p,i)=>{const b=g.points[(i+1)%g.size];return `<line x1="${p[0]}" y1="${p[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#bbcee8" stroke-width="2"/>`}).join('')}</svg>${g.points.map((p,i)=>{const id=s.players[i],candidate=!editing&&s.complete&&s.leaders.length>1&&active?.group!==g.name&&s.leaders.includes(id),canWin=!editing&&active?.group===g.name&&s.games[active.index]?.players.includes(id);return `<button class="vertex ${selected===id&&id?'selected':''} ${candidate||canWin?'pick':''} ${q===id&&id?'qualified':''}" style="left:${p[0]}px;top:${p[1]}px" ${editing?`data-slot="${g.offset+i}" ${id?`draggable="true" data-drag="${id}"`:''}`:`data-group="${g.name}" data-player="${id}" ${!candidate&&!canWin||busy?'aria-disabled="true"':''}`} aria-label="${editing?`${g.name} 組位置 ${i+1}`:`${g.name} 組 ${playerName(id)}${candidate?'晉級':'獲勝'}`}">${id?img(id):'<div style="height:61px;line-height:61px">＋</div>'}<span>${id?`${playerName(id)}`:`位置 ${i+1}`}</span>${!editing?`<span class="stat">${s.wins[id]} 勝${q===id?' · 晉級':''}</span>`:''}</button>`}).join('')}${!editing?s.games.map((m,i)=>{const a=g.points[i],b=g.points[(i+1)%g.size];return `<button class="edge ${m.winner?'done':''} ${active?.group===g.name&&active.index===i?'active':''}" style="left:${(a[0]+b[0])/2}px;top:${(a[1]+b[1])/2}px" data-edge="${g.name}" data-index="${i}" ${busy?'disabled':''} aria-label="${g.name} 組第 ${roundLabel(g,i)} 場：${m.players.map(playerName).join(' 對 ')}">第 ${roundLabel(g,i)} 場${m.winner?`<span class="winner-label">${playerName(m.winner)} 勝</span>`:''}</button>`}).join(''):''}</div><div class="group-status ${s.complete&&!q?'tie':''}">${editing?g.size===4?'上下第1場、左右第2場；不打對角。':'三人互相對戰，每人兩場。':active?.group===g.name?`第 ${roundLabel(g,active.index)} 場：點選正確勝者，可更正。`:q?`分組第一：${playerName(q)}${s.leaders.length>1?'（可點其他藍框大頭更改）':''}`:s.complete?`同為 ${s.wins[s.leaders[0]]} 勝，請老師點選藍框大頭晉級。`:'點場次再點勝者；已完成也能重新點選。'}</div></section>`}
function render(){document.querySelector('#reset').hidden=state.screen==='home';if(state.screen==='home'){app.innerHTML='<section class="home"><h2>安排預賽分組</h2><div class="choices"><button class="primary" id="random">隨機分配</button><button id="manual">老師分配</button></div><p class="hint" style="margin-top:20px">一組四人、三組三人，每人預賽兩場。</p></section>';document.querySelector('#random').onclick=()=>setup(true);document.querySelector('#manual').onclick=()=>setup(false);return}
const edit=state.screen==='setup';app.innerHTML=`${edit?`<p class="hint">拖曳大頭到圖形頂點，或先點大頭再點位置；已放入的大頭可以互換。</p><div class="pool">${ids.filter(p=>!state.order.includes(p)).map(person).join('')||'13 位選手已就位，可拖曳互換。'}</div>`:''}<div class="groups">${Cup.groups.map(g=>shape(g,edit)).join('')}</div>${edit?`<div class="actions"><button id="shuffle">重新隨機</button><button class="primary" id="start" ${state.order.includes(null)?'disabled':''}>開始預賽</button></div>`:finalView()}`;
if(edit){document.querySelector('#shuffle').onclick=()=>{state.order=shuffle();save();render()};document.querySelector('#start').onclick=()=>{state.screen='board';save();render()};document.querySelectorAll('[data-person]').forEach(el=>{el.onclick=()=>{selected=Number(el.dataset.person);render()};el.ondragstart=e=>e.dataTransfer.setData('text/plain',el.dataset.person)});document.querySelectorAll('[data-slot]').forEach(el=>{el.onclick=()=>{if(selected)place(selected,Number(el.dataset.slot));else if(el.dataset.drag){selected=Number(el.dataset.drag);render()}};el.ondragstart=e=>e.dataTransfer.setData('text/plain',el.dataset.drag||'');el.ondragover=e=>{e.preventDefault();el.classList.add('over')};el.ondragleave=()=>el.classList.remove('over');el.ondrop=e=>{e.preventDefault();place(Number(e.dataTransfer.getData('text/plain')),Number(el.dataset.slot))}});return}
document.querySelectorAll('[data-edge]').forEach(el=>el.onclick=()=>{active={group:el.dataset.edge,index:Number(el.dataset.index)};render()});document.querySelectorAll('[data-group]').forEach(el=>el.onclick=()=>{const g=Cup.groups.find(g=>g.name===el.dataset.group),s=Cup.summary(state,g),p=Number(el.dataset.player);if(busy)return;if(active?.group===g.name){const m=s.games[active.index];if(!m.players.includes(p))return;const changed=m.winner!==p;state.results[m.key]=p;active=null;if(changed){const updated=Cup.summary(state,g);setQualifier(g.name,updated.complete&&updated.leaders.length===1?updated.leaders[0]:undefined);}save();render();notify(changed&&m.winner?'已更正勝者':'已記錄勝者');return;}if(s.complete&&s.leaders.includes(p)){setQualifier(g.name,p);save();render();notify(`${g.name} 組：${playerName(p)}晉級決賽`);}});document.querySelectorAll('[data-final]').forEach(el=>el.onclick=()=>winFinal(el.dataset.final,Number(el.dataset.player),el));fitFinal();}
const positions={A:[80,340],B:[260,340],C:[460,340],D:[640,340],S1:[170,190],S2:[550,190],F:[360,50]};
function finalView(){const readyAll=Object.keys(state.qualifiers).length===4;const nodes=['A','B','C','D','S1','S2','F'].map(id=>{const p=state.qualifiers[id]||state.finals[id],game=id==='A'||id==='B'?'S1':id==='C'||id==='D'?'S2':id==='S1'||id==='S2'?'F':null,opponents=game?Cup.finalist(state,game):[],ready=readyAll&&game&&opponents.every(Boolean),won=game&&state.finals[game]===p&&p,finished=game&&state.finals[game],pos=positions[id];return `<div class="final-node ${id==='F'?'champ':''}" id="node-${id}" style="left:${pos[0]}px;top:${pos[1]}px"><button class="${ready?'ready':''} ${won?'won':finished?'lost':''}" ${ready&&!busy?`data-final="${game}" data-player="${p}"`:'aria-disabled="true"'} aria-label="${p?`${playerName(p)}`:'等待選手'}${game?'獲勝':''}">${p?`${img(p)}<span>${playerName(p)}${won?' ✓':''}</span>`:'<span class="placeholder">待定</span>'}</button><small>${id==='F'?'🏆 總冠軍':id.startsWith('S')?'準決賽勝者':`${id} 組第一`}</small></div>`}).join('');return `<section class="final-section"><h2>決賽</h2><p class="hint">${state.finals.F?`🏆 ${playerName(state.finals.F)}獲得冠軍！`:readyAll?'點大頭晉級；點另一位可更正勝者。':'四組第一就位後，進行 A 對 B、C 對 D。'}</p><div class="final-sizer"><div class="final-board"><svg aria-hidden="true"><path d="M80 340 V260 H260 V340 M170 260 V190 M460 340 V260 H640 V340 M550 260 V190 M170 190 V115 H550 V190 M360 115 V50" fill="none" stroke="#b6cbe9" stroke-width="3"/></svg>${nodes}</div></div></section>`}
function fitFinal(){const s=document.querySelector('.final-sizer');if(!s)return;const scale=Math.min(1,(document.documentElement.clientWidth-32)/720);s.style.width=720*scale+'px';s.style.height=400*scale+'px';s.firstElementChild.style.transform=`scale(${scale})`}
window.addEventListener('resize',fitFinal);
async function winFinal(game,p,el){if(busy||!Cup.finalist(state,game).includes(p))return;if(state.finals[game]===p){notify('這位選手已是本場勝者');return;}busy=true;document.querySelectorAll('button').forEach(b=>b.disabled=true);const start=el.querySelector('img').getBoundingClientRect(),target=document.querySelector(`#node-${game} button`).getBoundingClientRect(),fly=document.createElement('img');fly.src=source(p);fly.className='fly';document.body.append(fly);const scale=document.querySelector('.final-board').getBoundingClientRect().width/720,joint=document.querySelector('.final-board').getBoundingClientRect().top+(game==='F'?115:260)*scale-29;try{await fly.animate([{left:start.left+'px',top:start.top+'px'},{left:start.left+'px',top:joint+'px'},{left:(target.left+target.width/2-29)+'px',top:joint+'px'},{left:(target.left+target.width/2-29)+'px',top:(target.top+4)+'px'}],{duration:matchMedia('(prefers-reduced-motion: reduce)').matches?30:900,fill:'forwards',easing:'ease-in-out'}).finished}catch{}fly.remove();
  if(game!=='F') delete state.finals.F;
  state.finals[game]=p;
  save();
  if(game==='F'){
    render();
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  busy=false;
  document.querySelector('#reset').disabled=false;
  render();
  if(game==='F') celebrateChampion(rawName(p),source(p));
}
// Pointer gestures are delegated so every copy of a portrait supports renaming.
const renameDialog=document.createElement('dialog');
renameDialog.className='rename-dialog';
renameDialog.innerHTML='<form><h2>修改選手姓名</h2><label for="rename-input">姓名</label><input id="rename-input" name="name" type="text" maxlength="30" autocomplete="off" required><p class="hint">改名會同步套用到分組與決賽。</p><div class="rename-actions"><button type="button" id="rename-cancel">取消</button><button type="submit" class="primary">儲存姓名</button></div></form>';
document.body.append(renameDialog);
let press=null,blockedClick=null,renameId=null;
function clearPress(){if(press){clearTimeout(press.timer);press.image.classList.remove('holding');press=null;}}
function openRename(id){renameId=id;const input=renameDialog.querySelector('input');input.value=rawName(id);renameDialog.showModal();input.focus();input.select();}
document.addEventListener('pointerdown',event=>{
  if(event.button!==0||busy||renameDialog.open)return;
  const image=event.target.closest('img[data-portrait]');if(!image)return;
  blockedClick=null;
  clearPress();const button=image.closest('button'),id=Number(image.dataset.portrait);
  const gesture={image,button,id,x:event.clientX,y:event.clientY,pointer:event.pointerId};
  press=gesture;image.classList.add('holding');
  gesture.timer=setTimeout(()=>{if(press!==gesture)return;blockedClick={button,until:Infinity};clearPress();openRename(id);},2000);
},true);
document.addEventListener('pointermove',event=>{if(press&&event.pointerId===press.pointer&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>10)clearPress();},true);
document.addEventListener('pointerup',()=>{clearPress();if(blockedClick)blockedClick.until=Date.now()+700;},true);
document.addEventListener('pointercancel',clearPress,true);
document.addEventListener('dragstart',clearPress,true);
window.addEventListener('blur',clearPress);
document.addEventListener('contextmenu',event=>{if(event.target.closest('img[data-portrait]'))event.preventDefault();},true);
document.addEventListener('click',event=>{const button=event.target.closest('button');if((blockedClick&&Date.now()<blockedClick.until&&button===blockedClick.button)||button?.getAttribute('aria-disabled')==='true'){event.preventDefault();event.stopImmediatePropagation();}},true);
renameDialog.querySelector('#rename-cancel').onclick=()=>renameDialog.close();
renameDialog.querySelector('form').onsubmit=event=>{event.preventDefault();const input=renameDialog.querySelector('input'),name=input.value.trim();if(!name){input.setCustomValidity('請輸入姓名');input.reportValidity();return;}state.names={...state.names,[renameId]:name};save();renameDialog.close();render();notify('姓名已更新');};
renameDialog.querySelector('input').oninput=event=>event.target.setCustomValidity('');
render();
