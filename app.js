const releaseGroups = [
  {name:'EP 1', songs:['So Long','Disasters','Send Your Son','Pin My Wings'], acoustic:true},
  {name:'EP 2', songs:['Trailing Fire','The Plan',"I'll Be Here",'Our Story'], acoustic:true},
  {name:'EP 3', songs:['Brandy',"I Don't Trust Myself",'Repaired','One Last Song'], acoustic:true},
  {name:'EP 4', songs:['Nothingness','Worth It','My Little Accident','Dreaming Daughters'], acoustic:true}
];
const focus = ['So Long','Disasters','Send Your Son','Pin My Wings'];
const songData = {};
for (const g of releaseGroups) for (const title of g.songs) songData[title]={title,group:g.name,key:'TBD',bpm:'TBD',status:'Reference demo',structure:'To confirm',chords:'',arrangement:'',harmony:'',tasks:{Jay:'Lock final key + scratch vocal',Bart:'Learn lead guitar / harmony ideas',Scott:'Bass arrangement + harmony ideas',Derek:'Drum arrangement + feel'}};

const memoryStore = Object.create(null);
let supabaseClient=null;
let remoteReady=false;
let isHydrating=false;
let currentSession=null;
let currentMember=null;
let realtimeChannel=null;
let currentOpenSong=null;
let currentOpenSongEdit=false;

function storeGet(key){
  try { return window.localStorage ? window.localStorage.getItem(key) : (key in memoryStore ? memoryStore[key] : null); }
  catch(e){ return key in memoryStore ? memoryStore[key] : null; }
}
function setLocalOnly(key,value){
  const v=String(value);
  memoryStore[key]=v;
  try { if(window.localStorage) window.localStorage.setItem(key,v); } catch(e) {}
}
function removeLocalOnly(key){
  delete memoryStore[key];
  try { if(window.localStorage) window.localStorage.removeItem(key); } catch(e) {}
}
function shouldSyncKey(key){ return !String(key).startsWith('wfv:lastActivityAuthor'); }
function storeSet(key,value){
  const v=String(value);
  setLocalOnly(key,v);
  if(remoteReady && !isHydrating && shouldSyncKey(key)) syncKeyRemote(key,v);
}
async function syncKeyRemote(key,value){
  if(!supabaseClient || !currentSession) return;
  const row={key,value,updated_at:new Date().toISOString(),updated_by:currentMember?.display_name||currentSession.user.email||'Band'};
  const {error}=await supabaseClient.from('workspace_kv').upsert(row,{onConflict:'key'});
  if(error) showSyncStatus('Sync error',true); else showSyncStatus('Synced');
}

function audioFile(title){ const map={'Pin My Wings':'Pin My Wing.mp3','Our Story':'Our Story.mp3','Dreaming Daughters':'Dreaming Daughters.mp3'}; return 'assets/audio/'+encodeURIComponent(map[title]||title+'.mp3'); }
function lyricPdf(title){return 'assets/lyrics/'+encodeURIComponent(title+'.pdf')}
const lyrics = {"Repaired": "[Verse 1]\nWhat have I become?\nWhat happened to my pride?\nWhat happened to the man\nthat used to live inside these walls I built\nTo fortify my heart and mind\nI know I failed but don't you cry\nI failed myself this time\n[Chorus]\nI need a reason\nI need a prayer\nWhere is the song I’m dying hear\nI want to believe\nI’m more than despair\nI am in pieces, I need repaired\n[verse 2]\nA voice in hollow rooms\nWhat I thought were words\nare just little tombs\nFilled with those who died while they wait\nAnd couldn’t ever get away\n[Chorus]\nI need a reason\nI need a prayer\nWhere is the song I’m dying hear\nI want to believe\nI’m more than despair\nI am in pieces, I need repaired\n[Bridge]\nI measured out my worth in all the wrong ways\nCounted on pain and swore it was proof\nBut you’ve been here to carry the weight\nYou show me the truth\n[Chorus]\nYou are the reason\nYour name is my prayer\nYou are the song I need to hear\n\nYou make me believe\nI’m more than despair\nYou pick up my pieces and you repair me", "I Don't Trust Myself": "I Don’t Trust Myself\n[verse 1]\nI have to keep the car in drive\nI have to keep my hands to my side\nAt all cost avoiding your eyes and your smile\nI have to keep these feelings inside\n[prechorus]\nIt’s too early for this\nAs I search for a kiss\nIt’s too early for this\n[chorus]\nCause I don’t think I trust myself\nI think I’m gonna need your help tonight\nI don’t think I trust myself\nTo make it through this night with you\n[verse 2]\nI’m hung on every word you speak\nI’m trying not to even think at all\nI’m just a pile of broken sticks\nAnd you’re the match that’s lit\n[chorus]\nCause I don’t think I trust myself\nI think I’m gonna need your help tonight\nI don’t think I trust myself\nTo make it through this night with you\n[prechorus]\nIt’s too early for this\nAs we turn and we twist\nIt’s too early for this\n[chorus]\nAnd I don’t think I trust myself\nI think I’m gonna need your help tonight\nI know I can not trust myself\nGod I hope you trust yourself tonight\n\nSo I’m gonna have to touch myself tonight", "Brandy": "[Verse 1]\nGirl, how do you always do it?\nEvery time I'm near you, I'm still falling quick\nYou laugh at my jokes even when they don’t stick\nWith every touch, my heart does a back flip\n[Pre-Chorus]\nI’m adding the little things\nBut the sum is overwhelming\n[Chorus]\nBrandy, you're sweeter than brandy\nthe apple of my eye, you’re the taste on my tongue\nBrandy, how you enchant me\nYou are the shine in my summer sun\n[Verse 2]\nI’ve ran every road, I’ve searched every street\nI’ve worn out my shoes, I’ve torn up my feet\nLord, I was ready to accept my defeat\nWhen you showed up and rolled over me\n\n[Pre-Chorus]\nIt’s probably something big, it’s probably something loud\nIt’s probably something I’ll never figure out\n[Chorus]\nBrandy, you're sweeter than brandy\nthe apple of my eye, you’re the taste on my tongue\nBrandy, how you enchant me\nYou are the shine in my summer sun\n\n[Chorus]\nBrandy, you're sweeter than brandy\n\nthe apple of my eye, you’re the taste on my tongue\nBrandy, how you enchant me\nYou are the shine in my summer sun", "Pin My Wings": "[Verse 1]​\nBeating, buzzing around the bulb\nI just hope it’s never turned off\nI’m trying to get caught\nI’m everything you’re not\n[Prechorus]\nHurry\nHurry up\n[Chorus]​\nPin my wings and pull me down​\nI still hum when you’re around​\nHollow bones and see thru skin​\nBut I’m in\nI’m in\n[Verse 2]​\nCut me open to find it\nAll the things that make me tick\nLabel me and color it\nEverything is counterfeit\n[Prechorus]\nHurry\nHurry up\n[Chorus]​\nPin my wings and pull me down​\nI still hum when you’re around​\nHollow bones and see thru skin​\nBut I’m in\nI’m in\n[Bridge]​\nWait\nWait\nWait\nI still wait\nWait\nWait\nWait\n\nOh god wait!\n[Chorus]​\nPin my wings and pull me down​\nI still hum when you’re around​\nHollow bones and see thru skin​\nBut I’m in\nI’m in\n[Chorus]​\nPin my wings and pull me down​\nI still hum when you’re around​\nHollow bones and see thru skin​\nBut I’m in\nI’m in", "My Little Accident": "[Verse 1]​\nI called you common sense\nYou were hilarious ​\nSo certain you’d save us​\nYou always had a knack​\nTo promise a bit more than you give back​\nNow look at where it's got us\n[Pre-Chorus]​\nWe paid close attention​\nBut only to ourselves​\nAnd had the best intentions\n[Chorus]​\nMy little, my little, my little accident​\nMy little, my little, my little accident​\nI'm starting to regret\n[Verse 2]​\nYou said you'd fight for me​\ngive me all the shiny things​\nI want from my giant screen\nBut somewhere down the line​\nWarnings screamed in my mind​\nNow look at where it's got us\n[Pre-Chorus]​\nPaid so much attention​\nBut only to ourselves​\nAnd had the best intentions\n[Chorus]​\nMy little, my little, my little accident​\nMy little, my little, my little accident​\nI should probably regret\n[Chorus]​\nMy little, my little, my little accident​\nMy little, my little, my little accident\n[Scream]\nMY LITTLE, MY LITTLE, MY LITTLE ACCIDENT​\nMY LITTLE, MY LITTLE, MY LITTLE ACCIDENT\n\nI won’t live to regret", "The Plan": "[Verse 1]\nI felt it fall, a touching tangent\nProvident, gradual gradient\nA divergent variant\nI'm running the numbers without a constant\n[Pre-Chorus 1]\nI can’t find a model\nThat fits the example\nMessed up mechanics\nBroken thermodynamics\n[Chorus 1]\nThis wasn’t the plan\nBut I’m clinging to anything\nBut this house is ablaze\nAnd I’m staying here anyway\n'Cause I’m stubborn as hell\nAnd I’m not going anywhere\nI’ll sit down by your fire\nAnd let it burn me away\n[Verse 2]\nFuse this frozen heart\nemm see delta tee\nAnd run the equation\nTo see your heat transferred to me\n[Pre-Chorus 2]\nGravity collapses\nThe space of our masses\nWe’re forming new bodies\nAstronomical oddities\n[Chorus 2]\nThis wasn’t the plan\nBut I’m clinging to anything\nBut this house is ablaze\nAnd I’m staying here anyway\n'Cause I’m stubborn as hell\nAnd I’m not going anywhere\nI’ll sit down by your fire\n\nAnd let it burn me away let it burn me away\n[Bridge]\nI’m forming a plan\nAnd I’m clinging to anything\nNow this house is ablaze\nAnd I’m staying here anyway\n'Cause I’m stubborn as hell\nAnd I’m not going anywhere\nI’ll sit down by your fire\nAnd let it burn me away\n[Outro]\nThis is the plan\nWe’re clinging to everything\nWhile this house is ablaze\nAnd we're going to stay\n'Cause we're stubborn as hell\nAnd we're not going anywhere\nWe'll dance in the fire\nAnd let ourselves burn away", "Disasters": "[Verse 1]\nWe are young\nAnd we are king\nAnd we can take on everything\nWe own this town\nWe’ll make them see\nWe’re not afraid of anything\n[Pre chorus]\nOf all the things\nAnd broken dreams\nThe songs we sing\nThat’s leading me\n[Chorus]\nI’m not afraid\nOf our mistakes\nWhat are we after\nDisasters\n[Verse 2]\nWe research\nAnd rehearse\nAll the lines\nTo make it worse\nWe fly our flags\nOur freedom face\nWaving guns\nVomit hate\n[Pre chorus]\nI close my eyes to all the things\nThat make my brain work differently\nI scream the hate on my tv\nAnd steal the soul of your family\n[Chorus]\nI’m not afraid\nOf our mistakes\nWhat are we after\nDisasters\nAnd honestly\n\nYou made a man of me\nwe run so fast towards\nDisasters\n[Chorus]\nI’m not afraid\nOf our mistakes\nWhat are we after\nDisasters\nAnd honestly\nYou made a man of me\nwe run so fast towards\nDisasters\n[outro]\nWe’ll fly our flags\nWe’ll storm the streets\nWe’ll shoot them first\nThey are different than me", "Send Your Son": "[Verse 1]\nSharpies bleed on executive lines\nFlashing cameras catch your smile\nPretend you know about sacrifice\nWhen you’ve never worked a day in your life\nMaps laid out for your biggest fans\nA holy writ master plan\nPhone buzzing all night for freedom\nWhile you push someone else to stand\n[Pre-Chorus]\nYou say never compromise\nEven if some people die\nBut you don’t hear the families cry\nYou will never pay the price\n[Chorus]\nSend your son\nSend your blood\nSend the name you're proudest of\nIf this war is righteous\nShow us what he’s made of\nSend your son\nDon't just preach\nDon't just wash your hands and leave\nIf you say it's worth the dying\nLet him face the enemy\n[Verse 2]\nFlags hang high in quiet halls shatter by screams\nYou draw the lines and let others cross, to sell your war machine\nCall it honor, call it fate, call it our destiny\nBut it’s just coffins coming home draped in misery\n[Pre-Chorus]\nYou praise the brave, you praise the strong\nAnd sing a patriot song\nYou send them marching into fire\nAnd just move along\n[Chorus]\n\nSend your son\nSend your blood\nSend the name you're proudest of\nIf this war is righteous\nLet’s see what he’s made of\nSend your son\nStand and see\nWhat you demand of our families\nYou swear your cause is holy\nLet him face the enemy\n[Bridge]\nYou don’t hear anyone pray\nYou don’t see the debt we pay\nIf only they made bone spur boots\nMaybe you could help when the cost comes due\nFor every name etched in the stone\nFor every mother at a grave alone\nFor every father who’s come undone\nFor every child that doesn’t come home\n[Final Chorus]\nSend your son\nSend your blood\nShow us the truth you're speaking of\nIf the future’s worth the fire\nLet him be the one\nSend your son\nThen you’ll see\nWhat you force on our families\nIf your cause is so sacred\nLet him face the enemy", "One Last Song": "[Verse 1]\nWell I'm happy for you\nAs you try it out again\nI hope this works out for you\nSeems I barely know you\nSince I started my life again\nI just hope he shows you love\n[pre-Chorus]\nI remember the days\nI remember the ache when you went away\nDo you remember the songs\nRemember what I sang\n[chorus]\nOne last song\nThat you'll never hear\nOne more display of affection\nThat you'll never feel\n[Verse 2]\nI feel that time has changed me\nAnd the hurt a distant sting\nAnother scar to hold on to\nOnce the sharpest image\nHas begun to fade into\nthe blurry photo I hold of you\n[pre-Chorus]\nI remember the days\nI remember the ache when you went away\nDo you remember the songs\nRemember what I sang\n[chorus]\nOne last song\nThat you'll never hear\nOne more display of affection\nThat you'll never feel\nOne last song\nThat you'll never hear\nOne last song\n\nThat you'll never hear (ooh)", "Worth It": "[Verse]\nWhen this planet caves\nAnd I’m solar wind\nWould I know the difference?\nA scar, a stain\nIt all feels the same\nWould it really make a difference?\n[Prechorus]\nAnd why do I, do I, do I\nWhy do I\n[Chorus]\nI just exist\nLike my loneliness\nAnd i’m not positive\nIt’s all worth it\nWhere do I fit,\nWhen the bad guys always win\ni’m not positive\nIt’s all worth it\n[Post-Chorus]\nTell me why\nTell me why\nTell me why\nIs it worth it\n[Verse 2]\nIt will always be the same\nWithout my face and the pain?\nWould it really make a difference?\nI’m tired of flooding my brain\nWith shit that’s clearly insane\nWould it really make a difference?\n[Prechorus]\nAnd why do I, do I, do I\nWhy do I\n[Chorus]\nI just exist\n\nLike my loneliness\nAnd i’m not positive\nIt’s all worth it\nWhere do I fit,\nWhen the bad guys always win\ni’m not positive\nIt’s all worth it\n[Post-Chorus]\nTell me why\nTell me why\nTell me why\nTell me why it’s all worth it\n[Prechorus]\nAnd why do I, do I, do I\nWhy do I\n[Chorus]\nI just exist\nLike my loneliness\nAnd i’m not positive\nIt’s all worth it\nWhere do I fit,\nWhen the bad guys always win\ni’m not positive\nIt’s all worth it\n[Post-Chorus]\nTell me why\nTell me why\nTell me why\nTell me why it’s all worth it", "Trailing Fire": "[verse 1]\nAre you holding your breath\nDo you just need to rest\nOne false step\nCould mean certain death\nBut you don’t have to fear me\n[verse 2]\nDid you come here alone\nAnd did you try to make yourself at home\ndid you bring a small army\nCause that’s what it would take to harm me\nI’m a ghost\nooooo\n[chorus]\nWe’ll be chasing diamonds\nabandon worlds that bind us\nTrailing fire behind us\nNever going home\nWhile the world is spinning\nwe’ll keep on pretending\nThis is just beginning\nMark another from my list\nI’m getting too good at this\n[verse 3]\nDid you try to disappear\nDid you run away from all your fears\nDid you look in the shadows\nFor what surely follows\nI’m a ghost\n[chorus]\nWe’ll be chasing diamonds\nabandon worlds that bind us\nTrailing fire behind us\n\nNever going home\nWhile the world is spinning\nwe’ll keep on pretending\nThis is just beginning\nMark another from my list\nI’m getting too good at this\n[chorus]\nWe’ll be chasing diamonds\nabandon worlds that bind us\nTrailing fire behind us\nNever going home\nWhile the world is spinning\nwe’ll keep on pretending\nThis is just beginning\nOoo ohhh\nMark another from my list\nMark it off, Mark it off\nMark another from my list\nI’m getting too good at this", "So Long": "[Verse 1]\nSomeone came through a side door\nI never noticed before\nDark windows drip with breath\nThis quickly became unpleasant\nA tacky jacket hung on the rail\nThe lights so thin, the colors pale\nEverything is slightly wrong\nEvery atom in a place they don’t belong\n[Pre-Chorus]\nCreaking under the weight\nbetween every heartbeat break\nI want to spit out the air\nBut you’re still here\n[Chorus]\nSo long to the blessed quiet\nSo long to the shape inside it\nNothing here feels like it’s mine\nNothing here feels right\nSo long to the easy spaces\nSo long to the funny faces\nEveryone around me is hanging on\nBut I just want you gone\n[Verse 2]\nThere’s a glass that never dries\nFilled with fluids from my eyes\nEvery corner holds the same face\nSomething slightly out of place\nA shadow that overstays\nBut everyone takes the bait\nAnd if i didn’t know any better\nI would swear they’re all believers\n[Pre-Chorus]\nThe taker never gives\nConvinced everything is his\n\nI’m so tired everyday\nI’m so tired of his face\n[Chorus]\nSo long to the blessed quiet\nSo long to the shape inside it\nNothing here feels like it’s mine\nNothing here feels right\nSo long to the easy spaces\nSo long to the funny faces\nEveryone around me is hanging on\nBut I just want you gone\n[Bridge]\nNot a word, not a sound\nStill it’s coming through the ground\nNot a trace, not a mark\nStill it finds me in the dark\nI didn’t ask, I didn’t claim\nI never want to ever hear that name\nA massive weight that doesn’t belong\nStill somehow lingers on\n[Chorus]\nSo long to the blessed quiet\nSo long to the shape inside it\nNothing here feels like it’s mine\nNothing here feels right\nSo long to the easy spaces\nSo long to the funny faces\nEveryone around me is hanging on\nBut I just want you gone", "Nothingness": "[Verse 1]\nUsed to be at war with the silence\nNow I’ve surrendered inside it\nI shouted over echoes\nJust to keep from sitting quiet\nTry my best to fight it\nBut I don’t think I can keep on hiding\nI’d spill my secrets\nBut I don't have any left to keep private\n[Chorus]\nLately I’ve been learning\nwatching clocks turning\nStanding in the rain as I rust\nI’ll do whatever I must\nBright lights keep burning\nBut if I pull back this curtain\nIs there anything left\nBeyond this nothingness\n[Verse 2]\nI’m calling on my conscience\nBut if I’m really being honest\nIt’s a bit indifferent\nLike it’s just trying to keep a promise\nWanted to rage at the rejection\nBut it didn’t feel like I expected\nJust a slow drifting\nTill I barely feel connected\n[Chorus]\nLately I’ve been learning\nwatching clocks turning\nStanding in the rain as I rust\nI’ll do whatever I must\nBright lights keep burning\nBut if I pull back this curtain\nIs there anything left\n\nBeyond this nothingness", "I'll Be Here": "I’ll Be Here\n[Verse 1]\nWhen you turn to me\nWhen you can’t speak\nWhen it's not easy\nI will be here\nwhen you're wide awake\nwith nothing to say\nthe clock ticks away\nI'll still be here\n[verse 2]\nWhen your days are long\nAnd before the dawn\nWhen you're not strong\nI'll still be hear\nWhen hope runs out\nconsuming doubt\nyou'll find out\nI'll still be here\n[prechorus]\nwith every step\nand with every breath\nuntil our death\nand maybe more\nwe'll open doors\nwe'll sleep on floors\nwho knows what's more\n[chorus]\nand I can breathe\nand fill my lungs\nMy burning tongue\nmy aching chest\nI'll give my best to you\nSo have no fear\nI'm still here\n[bridge]\nWhen the moon forgets your name\nI'll etch it in the sky again\nWhen your soul begins to slip\n\nI’ll be the one to catch it\nSo let the shadows flood the room\nI'll dance with every ghost for you\nA vow I'll never fear\nbecause I'm still here\n[prechorus]\nwith every step\nand with every breath\nuntil our death\nand maybe more\nwe'll open doors\nwe'll sleep on floors\nwho knows what's more\n[chorus]\nand I can breathe\nand fill my lungs\nMy burning tongue\nmy aching chest\nI'll give my best to you\nSo have no fear\nI'm still here\n\nVideo:\nOpens with waltz, with singer dancing with woman\nJames Bond influence", "Our Story": "[verse]\nWe failed\nWe cried\nHad dreams\nSome died\nOur hearts\nAnd our fears\nGrowing pains\nGrowing near\n[prechorus]\nAll of my rules reversed\nAll of my lines rehearsed\nFor you\nBut will this fall fade out\nOr will we drown in doubt\nNever\n[verse]\nSo we fought\nAnd we found\nThe one thing\nWe can’t live without\n[chorus]\nHold on\nHold on to me now\nAnd never let the world pull us down\nHold on\nHold on somehow\nYou’re the one thing I can’t live without", "Dreaming Daughters": "[Verse 1]\nWe're not finished fighting yet\nThis war isn’t won\nThe flames of fires burning fast\nOur hearts still beat as one\n[Chorus]\nWe stand after the fall\nUnbent backs against the wall\nSilver-lined lessons learned\nNEVER broken, NEVER burned\nReach out, rise up, IGNITE,\nmake the sun jealous in the sky,\nRun the rivers, split the seas,\nWe are the storm, the symphony\n[Verse 2]\nFaster forward, farther yet\nrunning towards tangled threads\nWe can’t break, we can’t bleed\nwhatever it takes, the anthem, our dreams\n[Chorus]\nWe stand after the fall\nUnbent backs against the wall\nSilver-lined lessons learned\nNEVER broken, NEVER burned\nReach out, rise up, IGNITE,\nmake the sun jealous in the sky,\nRun the rivers, split the seas,\nWe are the storm, the symphony\n[Bridge]\nIn the shadow, WE RESIST,\nBefore we fold or fade, WE PERSIST,\nWe're burning with purpose, etching the cuts\nThe fever within us BURNING US UP\n[Chorus]\nWe stand after the fall\nUnbent backs against the wall\nSilver-lined lessons learned\nNEVER broken, NEVER burned\nReach out, rise up, IGNITE,\nmake the sun jealous in the sky,\nRun the rivers, split the seas,\nWe are the storm, the symphony\nWe are the storm, the symphony..."};

const views=[...document.querySelectorAll('.view')];
function setView(id){views.forEach(v=>v.classList.toggle('active',v.id===id)); document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.view===id)); window.scrollTo({top:0,behavior:'smooth'});}
document.querySelectorAll('.nav button').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
document.getElementById('menuBtn').onclick=()=>document.getElementById('nav').classList.toggle('open');

const preprodStages=['Key Locked','Arrangement Locked','Chart Ready','Band Learned','Rehearsed','Ready to Track'];
function preprodKey(title,stage){return `wfv-preprod:${title}:${stage}`}
function preprodDone(title,stage){return storeGet(preprodKey(title,stage))==='1'}
function preprodPercent(title){return Math.round((preprodStages.filter(stage=>preprodDone(title,stage)).length/preprodStages.length)*100)}
window.togglePreprodStage=function(title,stage){
  const key=preprodKey(title,stage);
  storeSet(key,preprodDone(title,stage)?'0':'1');
  openSong(title);
}
function songFieldKey(title,field){return `wfv-song:${title}:${field}`}
function songField(title,field){const saved=storeGet(songFieldKey(title,field)); return saved===null ? (songData[title][field]??'') : saved}
function memberTask(title,member){const k=songFieldKey(title,`task-${member}`); const saved=storeGet(k); return saved===null?songData[title].tasks[member]:saved}
function songCard(title){const s=songData[title], pct=preprodPercent(title);return `<button class="song-card" data-action="open-song" data-title="${escapeAttr(title)}" style="text-align:left;color:inherit;width:100%"><span class="tag ${focus.includes(title)?'focus':''}">${focus.includes(title)?'CURRENT FOCUS':s.group}</span><h3>${title}</h3><p>${songField(title,'status')} · Key ${songField(title,'key')} · ${songField(title,'bpm')} BPM</p><div class="progress mini-progress"><div style="width:${pct}%"></div></div><small class="progress-label">Preproduction ${pct}%</small></button>`}
function renderDashboard(){
 const overall=Math.round(focus.reduce((sum,title)=>sum+preprodPercent(title),0)/focus.length);
 document.getElementById('dashboard').innerHTML=`
 <div class="grid">
  <div class="card span-8"><div class="section-title"><div><h2>Current Focus</h2><p>First recording block</p></div><span class="tag focus">4 SONGS</span></div><div class="song-grid">${focus.map(songCard).join('')}</div></div>
  <div class="card span-4"><div class="section-title"><div><h2>Preproduction</h2><p>First four songs</p></div><strong class="big-percent">${overall}%</strong></div><div class="progress"><div style="width:${overall}%"></div></div><p style="color:var(--muted)">The dashboard now reflects the song-by-song preproduction checklists. Open a song to update its key, chart, arrangement, harmony notes and readiness.</p></div>
  <div class="card span-12"><div class="section-title"><div><h2>Milestones</h2><p>From preproduction to release</p></div></div><div class="steps"><div class="step active">1. Keys</div><div class="step">2. Learn + Rehearse</div><div class="step">3. Drum Tracking</div><div class="step">4. Release</div></div></div>
  <div class="card span-6"><div class="section-title"><div><h2>Immediate Checklist</h2></div></div><div class="task-list"><div class="task"><div><b>Jay</b><span>Confirm comfortable final keys + new scratch demos</span></div><span>Next</span></div><div class="task"><div><b>Everybody</b><span>Learn first four references and flag arrangement changes</span></div><span>Queued</span></div><div class="task"><div><b>Scott + Bart</b><span>Start mapping three-part harmony opportunities</span></div><span>Queued</span></div><div class="task"><div><b>Derek</b><span>Work first four front-to-back on electronic kit</span></div><span>Queued</span></div></div></div>
  <div class="card span-6"><div class="section-title"><div><h2>Recording Direction</h2></div></div><div class="notice">Do the cheap thinking before the expensive recording. Nail keys, tempos, structures, parts and harmony concepts first; then use studio time for performances, not decisions.</div><p style="color:var(--muted)">Drum tracking target discussed: November/December, with Sienna Studios Nashville as the likely room.</p></div>
 </div>`;
}
function renderSongs(){document.getElementById('songs').innerHTML=releaseGroups.map(g=>`<div class="card" style="margin-bottom:16px"><div class="section-title"><div><h2>${g.name}</h2><p>${g.songs.length} songs + 1 acoustic version</p></div><span class="tag">5-TRACK EP</span></div><div class="song-grid">${g.songs.map(songCard).join('')}<div class="song-card" style="text-align:left;color:inherit;width:100%"><span class="tag">ACOUSTIC BONUS</span><h3>Acoustic Version</h3><p>One song from ${g.name} · TBD</p></div></div></div>`).join('')}
function renderSchedule(){
 const calendarId='od2m6ctb7ukjol0qrhmh1go0os@group.calendar.google.com';
 const encodedId=encodeURIComponent(calendarId);
 const embedUrl=`https://calendar.google.com/calendar/embed?src=${encodedId}&ctz=America%2FIndiana%2FIndianapolis`;
 const openUrl=`https://calendar.google.com/calendar/u/0/r?cid=${encodedId}`;
 const addUrl='https://calendar.google.com/calendar/render?action=TEMPLATE';
 document.getElementById('schedule').innerHTML=`
 <div class="card" style="margin-bottom:16px">
   <div class="section-title"><div><h2>WFV Calendar</h2><p>Rehearsals, recording dates and deadlines</p></div><span class="tag focus">SHARED</span></div>
   <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px">
     <a class="pill" href="${openUrl}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">Open Full Calendar ↗</a>
     <a class="pill" href="${addUrl}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">Add Event ↗</a>
   </div>
   <div style="position:relative;width:100%;min-height:650px;overflow:hidden;border-radius:12px">
     <iframe src="${embedUrl}" style="border:0;width:100%;height:650px" frameborder="0" scrolling="no" title="Waltz for Venus Google Calendar"></iframe>
   </div>
   <p class="footer-note">Band members need permission to view the shared Google Calendar while signed into Google.</p>
 </div>
 <div class="card"><div class="section-title"><div><h2>Working Timeline</h2><p>High-level production path</p></div></div><div class="timeline"><div class="timeline-item"><strong>Keys</strong><div>Lock comfortable final keys, scratch recordings, charts, arrangement notes and harmony plans for the first four songs.</div></div><div class="timeline-item"><strong>Learn + Rehearse</strong><div>Individual homework, band rehearsals and final arrangement decisions before tracking.</div></div><div class="timeline-item"><strong>Drum Tracking</strong><div>Track drums once the arrangements are settled and everyone is prepared.</div></div><div class="timeline-item"><strong>Release</strong><div>Finish instruments, vocals, harmonies, mixing/mastering and execute the single/EP release plan.</div></div></div></div>`
}
const recordingStages=['Drums','Bass','Rhythm Guitar / Piano','Lead Guitar','Lead Vocals','Backing Vocals','Overdubs','Mix','Master'];
function recordingKey(title,stage){return `wfv-recording:${title}:${stage}`}
function stageDone(title,stage){return storeGet(recordingKey(title,stage))==='1'}
window.toggleRecordingStage=function(title,stage){
  const key=recordingKey(title,stage);
  storeSet(key,stageDone(title,stage)?'0':'1');
  renderRecording();
}
function recordingSongRow(title){
  const done=recordingStages.filter(stage=>stageDone(title,stage)).length;
  const pct=Math.round((done/recordingStages.length)*100);
  return `<div class="recording-song">
    <div class="recording-song-head"><div><span class="tag">${songData[title].group}</span><h3>${title}</h3></div><strong>${pct}%</strong></div>
    <div class="progress recording-progress"><div style="width:${pct}%"></div></div>
    <div class="recording-stages">${recordingStages.map(stage=>`<button class="recording-stage ${stageDone(title,stage)?'done':''}" data-action="toggle-recording" data-title="${escapeAttr(title)}" data-stage="${escapeAttr(stage)}"><span class="checkmark">${stageDone(title,stage)?'✓':''}</span>${stage}</button>`).join('')}</div>
  </div>`
}
function renderRecording(){
  const allSongs=releaseGroups.flatMap(g=>g.songs);
  document.getElementById('recording').innerHTML=`
    <div class="grid">
      <div class="card span-6"><div class="section-title"><div><h2>Home / Remote</h2></div></div><p>Best use: scratch vocals, guitar/piano guides, arrangement testing, harmony demos, edits and overdubs that don't require a premium room.</p></div>
      <div class="card span-6"><div class="section-title"><div><h2>Nashville</h2></div></div><p>Best use: drums first, then anything that benefits from Scott's studio access, room, mics, preamps and fast collaborative decisions.</p></div>
      <div class="card span-12"><div class="section-title"><div><h2>Recording Progress</h2><p>Click a stage when that part is finished for a song.</p></div></div><div class="recording-list">${allSongs.map(recordingSongRow).join('')}</div><p class="footer-note">${remoteReady?'Recording progress is shared with the whole band.':'Local preview mode: recording progress is saved only in this browser.'}</p></div>
    </div>`
}
let songFlashMessage='';
window.editSong=function(title){openSong(title,true)}
window.cancelSongEdit=function(title){openSong(title,false)}
window.saveSongWorkspace=function(title){
  ['key','bpm','status','structure','chords','arrangement','harmony'].forEach(field=>{
    const el=document.getElementById(`song-${field}`); if(el) storeSet(songFieldKey(title,field),el.value);
  });
  ['Jay','Bart','Scott','Derek'].forEach(member=>{
    const el=document.getElementById(`task-${member}`); if(el) storeSet(songFieldKey(title,`task-${member}`),el.value);
  });
  songFlashMessage='Saved ✓';
  renderDashboard(); renderSongs();
  openSong(title,false);
}


// Song activity / discussion notes (local-only until shared backend is added)
const bandMembers=['Jay','Bart','Scott','Derek'];
function activityKey(title){return `wfv:activity:${title}`}
function getActivity(title){
  try { const raw=storeGet(activityKey(title)); const parsed=raw?JSON.parse(raw):[]; return Array.isArray(parsed)?parsed:[]; }
  catch(e){ return []; }
}
function saveActivity(title,items){storeSet(activityKey(title),JSON.stringify(items))}
function addActivity(title){
  const author=document.getElementById('activity-author');
  const note=document.getElementById('activity-note');
  if(!note) return;
  const text=note.value.trim();
  if(!text) return;
  const authorName=remoteReady?(currentMember?.display_name||currentSession?.user?.email||'Band'):(author?.value||'Jay');
  const items=getActivity(title);
  items.unshift({id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,author:authorName,text,createdAt:new Date().toISOString()});
  saveActivity(title,items);
  if(!remoteReady && author) storeSet('wfv:lastActivityAuthor',author.value);
  openSong(title,false);
}
function deleteActivity(title,id){
  const items=getActivity(title).filter(item=>item.id!==id);
  saveActivity(title,items);
  openSong(title,false);
}
function formatActivityDate(value){
  try { return new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(value)); }
  catch(e){ return ''; }
}
function activityMarkup(title){
  const selected=storeGet('wfv:lastActivityAuthor')||'Jay';
  const items=getActivity(title);
  return `<div class="activity-panel">
    <div class="activity-compose">
      <div class="activity-compose-top">
        ${remoteReady?`<div class="posting-as">Posting as <strong>${escapeHtml(currentMember?.display_name||currentSession?.user?.email||'Band')}</strong></div>`:`<label>Posting as<select id="activity-author">${bandMembers.map(m=>`<option value="${escapeAttr(m)}" ${m===selected?'selected':''}>${m}</option>`).join('')}</select></label>`}
      </div>
      <textarea id="activity-note" class="workspace-textarea" placeholder="Add a rehearsal note, arrangement idea, question, or decision…"></textarea>
      <div class="activity-compose-actions"><button class="pill primary" data-action="add-activity" data-title="${escapeAttr(title)}">Add Note</button></div>
    </div>
    <div class="activity-feed">${items.length?items.map(item=>`<article class="activity-item">
      <div class="activity-head"><div><strong>${escapeHtml(item.author||'Band')}</strong><span>${escapeHtml(formatActivityDate(item.createdAt))}</span></div><button class="activity-delete" title="Delete note" data-action="delete-activity" data-title="${escapeAttr(title)}" data-id="${escapeAttr(item.id)}">×</button></div>
      <div class="activity-text">${escapeHtml(item.text||'')}</div>
    </article>`).join(''):`<div class="activity-empty">No notes yet. Add the first rehearsal thought, question, or decision for this song.</div>`}</div>
  </div>`;
}
function displayValue(value,empty='Not set yet'){const v=String(value??'').trim();return v?escapeHtml(v):`<span class="empty-value">${empty}</span>`}
function detailBlock(label,value,empty='Not set yet'){return `<div class="detail-block"><div class="detail-label">${label}</div><div class="detail-value">${displayValue(value,empty)}</div></div>`}
window.openSong=function(title,editMode=false){
  currentOpenSong=title; currentOpenSongEdit=editMode;
  const s=songData[title]; const pct=preprodPercent(title);
  const flash=songFlashMessage; songFlashMessage='';
  const topActions=editMode
    ? `<button class="pill secondary" data-action="cancel-edit" data-title="${escapeAttr(title)}">Cancel</button><button class="pill primary" data-action="save-song" data-title="${escapeAttr(title)}">Save Changes</button>`
    : `<button class="pill primary" data-action="edit-song" data-title="${escapeAttr(title)}">Edit Song</button>`;
  const mainContent=editMode ? `
    <div class="edit-banner"><strong>Editing ${title}</strong><span>Make your changes below, then click Save Changes.</span></div>
    <div class="editable-meta">
      <label>Key<input id="song-key" value="${escapeAttr(songField(title,'key'))}" placeholder="TBD"></label>
      <label>BPM<input id="song-bpm" value="${escapeAttr(songField(title,'bpm'))}" placeholder="TBD"></label>
      <label>Status<input id="song-status" value="${escapeAttr(songField(title,'status'))}" placeholder="Reference demo"></label>
    </div>
    <h3>Song Structure</h3><textarea id="song-structure" class="workspace-textarea" placeholder="Intro · Verse 1 · Pre · Chorus...">${escapeHtml(songField(title,'structure'))}</textarea>
    <h3>Chords / Chart</h3><textarea id="song-chords" class="workspace-textarea tall" placeholder="Paste chord chart, Nashville numbers, section cues, capo notes, etc.">${escapeHtml(songField(title,'chords'))}</textarea>
    <h3>Arrangement Notes</h3><textarea id="song-arrangement" class="workspace-textarea tall" placeholder="Stops, builds, dynamics, instrumentation, alternate endings, etc.">${escapeHtml(songField(title,'arrangement'))}</textarea>
    <h3>Harmony Notes</h3><textarea id="song-harmony" class="workspace-textarea" placeholder="Three-part harmony ideas, who takes which part, specific entrances...">${escapeHtml(songField(title,'harmony'))}</textarea>`
    : `<div class="meta read-meta"><div><small>Key</small><strong>${displayValue(songField(title,'key'),'TBD')}</strong></div><div><small>BPM</small><strong>${displayValue(songField(title,'bpm'),'TBD')}</strong></div><div><small>Status</small><strong>${displayValue(songField(title,'status'),'Reference demo')}</strong></div></div>
       <div class="detail-stack">
         ${detailBlock('Song Structure',songField(title,'structure'),'To confirm')}
         ${detailBlock('Chords / Chart',songField(title,'chords'),'No chart added yet')}
         ${detailBlock('Arrangement Notes',songField(title,'arrangement'),'No arrangement notes yet')}
         ${detailBlock('Harmony Notes',songField(title,'harmony'),'No harmony notes yet')}
       </div>`;
  const memberContent=editMode
    ? `<label class="member-note"><span>Jay</span><textarea id="task-Jay">${escapeHtml(memberTask(title,'Jay'))}</textarea></label>
       <label class="member-note"><span>Bart</span><textarea id="task-Bart">${escapeHtml(memberTask(title,'Bart'))}</textarea></label>
       <label class="member-note"><span>Scott</span><textarea id="task-Scott">${escapeHtml(memberTask(title,'Scott'))}</textarea></label>
       <label class="member-note"><span>Derek</span><textarea id="task-Derek">${escapeHtml(memberTask(title,'Derek'))}</textarea></label>`
    : `<div class="member-task-view"><strong>Jay</strong><span>${displayValue(memberTask(title,'Jay'),'No task assigned')}</span></div>
       <div class="member-task-view"><strong>Bart</strong><span>${displayValue(memberTask(title,'Bart'),'No task assigned')}</span></div>
       <div class="member-task-view"><strong>Scott</strong><span>${displayValue(memberTask(title,'Scott'),'No task assigned')}</span></div>
       <div class="member-task-view"><strong>Derek</strong><span>${displayValue(memberTask(title,'Derek'),'No task assigned')}</span></div>`;
  document.getElementById('songDetail').innerHTML=`
<button class="ghost back" data-action="back-songs">← Back to songs</button>
<div class="grid">
  <div class="card span-8">
    <div class="workspace-head"><div><span class="tag ${focus.includes(title)?'focus':''}">${focus.includes(title)?'CURRENT FOCUS':s.group}</span><h2 style="font-size:2.4rem;margin:.5rem 0">${title}</h2>${flash?`<div class="saved-flash">${flash}</div>`:''}</div><div class="workspace-actions">${topActions}</div></div>
    ${mainContent}
    <h3>Reference Demo</h3><audio id="referenceAudio" controls preload="metadata" src="${remoteReady?'':audioFile(title)}"></audio><div id="assetStatus" class="asset-status">${remoteReady?'Loading private reference files…':''}</div>
    <p><a id="lyricPdfLink" class="pill" href="${remoteReady?'#':lyricPdf(title)}" target="_blank" rel="noopener" style="text-decoration:none;display:inline-block">Open lyric PDF ↗</a></p>
    <h3>Lyrics</h3><div class="lyrics">${escapeHtml(formatLyrics(lyrics[title]||'Lyrics loading…'))}</div>
    ${editMode?`<div class="bottom-save"><button class="pill secondary" data-action="cancel-edit" data-title="${escapeAttr(title)}">Cancel</button><button class="pill primary" data-action="save-song" data-title="${escapeAttr(title)}">Save Changes</button></div>`:''}
  </div>
  <div class="card span-4">
    <div class="section-title"><div><h3>Preproduction Progress</h3><p>${pct}% complete</p></div><strong class="big-percent">${pct}%</strong></div>
    <div class="progress"><div style="width:${pct}%"></div></div>
    <div class="preprod-stages">${preprodStages.map(stage=>`<button class="recording-stage ${preprodDone(title,stage)?'done':''}" data-action="toggle-preprod" data-title="${escapeAttr(title)}" data-stage="${escapeAttr(stage)}"><span class="checkmark">${preprodDone(title,stage)?'✓':''}</span>${stage}</button>`).join('')}</div>
    <p class="click-hint">Click these anytime — no Edit mode needed.</p>
    <h3 style="margin-top:24px">Member Notes / Tasks</h3>
    ${memberContent}
    <h3 style="margin-top:24px">Activity / Discussion</h3>
    ${activityMarkup(title)}
    <div class="notice" style="margin-top:16px">${remoteReady?'Shared with the band · changes sync through Supabase.':'Local preview mode · changes are only in this browser.'}</div>
  </div>
</div>`;
  setView('songDetail');
  if(remoteReady) loadPrivateAssets(title);
}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function escapeAttr(s){return escapeHtml(String(s)).replace(/`/g,'&#96;')}

function handleActionClick(event){
  const btn=event.target.closest('[data-action]');
  if(!btn) return;
  const action=btn.dataset.action;
  const title=btn.dataset.title;
  const stage=btn.dataset.stage;
  const id=btn.dataset.id;
  if(action==='open-song') return openSong(title,false);
  if(action==='edit-song') return openSong(title,true);
  if(action==='cancel-edit') return openSong(title,false);
  if(action==='save-song') return saveSongWorkspace(title);
  if(action==='toggle-recording') return toggleRecordingStage(title,stage);
  if(action==='toggle-preprod') return togglePreprodStage(title,stage);
  if(action==='add-activity') return addActivity(title);
  if(action==='delete-activity') return deleteActivity(title,id);
  if(action==='back-songs') return setView('songs');
  if(action==='google-login') return googleLogin();
  if(action==='sign-out') return signOut();
}
document.addEventListener('click',handleActionClick);
function render(){renderDashboard();renderSongs();renderSchedule();renderRecording()}
bootstrap();


// ---- Shared workspace: Google Auth + Supabase ----
function hasSupabaseConfig(){
  const c=window.WFV_CONFIG||{};
  return Boolean(c.SUPABASE_URL && c.SUPABASE_PUBLISHABLE_KEY && !String(c.SUPABASE_URL).includes('YOUR_PROJECT'));
}
function authArea(){return document.getElementById('authArea')}
function authGate(){return document.getElementById('authGate')}
function appShell(){return document.querySelector('.shell')}
function setGate(html){
  const gate=authGate(); if(!gate) return;
  gate.innerHTML=html; gate.hidden=false;
  if(appShell()) appShell().classList.add('locked');
}
function unlockApp(){
  const gate=authGate(); if(gate) gate.hidden=true;
  if(appShell()) appShell().classList.remove('locked');
}
function showSyncStatus(text,isError=false){
  const el=document.getElementById('syncStatus'); if(!el) return;
  el.textContent=text; el.classList.toggle('error',Boolean(isError));
  if(!isError) setTimeout(()=>{if(el.textContent===text) el.textContent='';},1600);
}
async function bootstrap(){
  render();
  if(!hasSupabaseConfig()){
    remoteReady=false;
    const area=authArea();
    if(area) area.innerHTML='<span class="local-badge">LOCAL PREVIEW</span>';
    const setup=document.getElementById('setupNotice');
    if(setup) setup.hidden=false;
    return;
  }
  if(!window.supabase?.createClient){
    setGate('<div class="login-card"><h2>Connection problem</h2><p>The Supabase library could not load. Check your internet connection and reload.</p></div>');
    return;
  }
  const c=window.WFV_CONFIG;
  supabaseClient=window.supabase.createClient(c.SUPABASE_URL,c.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session) await activateSession(session); else showLogin();
  supabaseClient.auth.onAuthStateChange(async (event,session)=>{
    if(event==='SIGNED_OUT' || !session){ currentSession=null; currentMember=null; remoteReady=false; showLogin(); return; }
    if(event==='SIGNED_IN' || event==='TOKEN_REFRESHED') await activateSession(session);
  });
}
function showLogin(message=''){
  remoteReady=false;
  const area=authArea(); if(area) area.innerHTML='';
  setGate(`<div class="login-card"><div class="eyebrow">WALTZ FOR VENUS</div><h2>Band Workspace</h2><p>Sign in with the Google account approved for the band.</p>${message?`<div class="auth-message">${escapeHtml(message)}</div>`:''}<button class="google-btn" data-action="google-login"><span class="google-g">G</span> Continue with Google</button><small>Unreleased audio, lyrics and project notes stay behind band-member access.</small></div>`);
}
async function googleLogin(){
  if(!supabaseClient) return;
  const redirectTo=window.location.origin==='null'?undefined:(window.location.origin+window.location.pathname);
  const options=redirectTo?{redirectTo}:undefined;
  const {error}=await supabaseClient.auth.signInWithOAuth({provider:'google',options});
  if(error) showLogin(error.message);
}
async function activateSession(session){
  currentSession=session;
  const email=session.user?.email||'';
  const {data:member,error}=await supabaseClient.from('band_members').select('email,display_name,role').eq('email',email.toLowerCase()).maybeSingle();
  if(error || !member){
    await supabaseClient.auth.signOut();
    showLogin('That Google account is not on the Waltz for Venus access list.');
    return;
  }
  currentMember=member;
  remoteReady=true;
  const area=authArea();
  if(area) area.innerHTML=`<div class="signed-in"><div><strong>${escapeHtml(member.display_name)}</strong><small>${escapeHtml(email)}</small></div><span id="syncStatus" class="sync-status"></span><button class="ghost small" data-action="sign-out">Sign out</button></div>`;
  await hydrateRemoteWorkspace();
  subscribeRealtime();
  unlockApp();
  render();
  if(currentOpenSong) openSong(currentOpenSong,currentOpenSongEdit);
}
async function hydrateRemoteWorkspace(){
  if(!supabaseClient) return;
  isHydrating=true;
  const {data,error}=await supabaseClient.from('workspace_kv').select('key,value');
  if(!error && data){ for(const row of data) setLocalOnly(row.key,row.value); }
  isHydrating=false;
  if(error) showSyncStatus('Could not load shared data',true);
}
function subscribeRealtime(){
  if(!supabaseClient) return;
  if(realtimeChannel) supabaseClient.removeChannel(realtimeChannel);
  realtimeChannel=supabaseClient.channel('wfv-workspace')
    .on('postgres_changes',{event:'*',schema:'public',table:'workspace_kv'},payload=>{
      const row=payload.new||payload.old;
      if(!row?.key) return;
      isHydrating=true;
      if(payload.eventType==='DELETE') removeLocalOnly(row.key); else setLocalOnly(row.key,row.value);
      isHydrating=false;
      render();
      if(currentOpenSong && !currentOpenSongEdit) openSong(currentOpenSong,false);
      showSyncStatus('Updated');
    }).subscribe();
}
async function signOut(){ if(supabaseClient) await supabaseClient.auth.signOut(); }
async function loadPrivateAssets(title){
  if(!supabaseClient || !remoteReady) return;
  const bucket=window.WFV_CONFIG?.STORAGE_BUCKET||'wfv-private';
  const audioPath=decodeURIComponent(audioFile(title).replace(/^assets\//,''));
  const pdfPath=decodeURIComponent(lyricPdf(title).replace(/^assets\//,''));
  const audio=document.getElementById('referenceAudio');
  const pdf=document.getElementById('lyricPdfLink');
  const status=document.getElementById('assetStatus');
  const [a,p]=await Promise.all([
    supabaseClient.storage.from(bucket).createSignedUrl(audioPath,60*60*2),
    supabaseClient.storage.from(bucket).createSignedUrl(pdfPath,60*60*2)
  ]);
  if(a.data?.signedUrl && audio){ audio.src=a.data.signedUrl; audio.load(); }
  if(p.data?.signedUrl && pdf){ pdf.href=p.data.signedUrl; }
  const errors=[a.error,p.error].filter(Boolean);
  if(status) status.textContent=errors.length?'Private file not uploaded yet. See SETUP.md.':'Private files loaded ✓';
}

function formatLyrics(text){
  return String(text||'').replace(/\r\n/g,'\n').replace(/\n{3,}/g,'\n\n').replace(/([^\n])\n(\s*\[[^\]]+\])/g,'$1\n\n$2').trim();
}


