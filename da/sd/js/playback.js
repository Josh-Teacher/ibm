import {points} from './rules.js';
const $ = id => document.getElementById(id);
function seatClass(el,faction) { el.classList.remove('faction-f1','faction-f2'); el.classList.add(`faction-${faction}`); }
export class Playback {
  constructor(onFinished=()=>{},onChange=()=>{}) {this.onFinished=onFinished;this.onChange=onChange;this.cursor=0;this.speed=1;this.paused=true;this.match=null;this.timeline=null;this.finished=false;this.token=0;this.gentle=false;}
  load(match,settings,{autoplay=true}={}) {
    this.stop();this.match=match;this.settings=settings;this.cursor=0;this.finished=false;this.paused=!autoplay;
    for(const side of ['left','right']) {
      const strategy=match[side]; seatClass($(`${side}-scorebox`),strategy.faction);seatClass($(`cell-${side}`),strategy.faction);seatClass($(`chart-${side}`),strategy.faction);
      $(`${side}-name`).textContent=strategy.name;$(`${side}-faction`).textContent=this.factionName(strategy.faction);
      $(`${side}-column`).textContent=`${strategy.faction.toUpperCase()} · DECISION / POINTS`;
      $(`cell-${side}`).querySelector('.cell-kicker').textContent=this.factionName(strategy.faction);
    }
    $('match-label').textContent=`MATCH ${String(match.index).padStart(2,'0')} / REPETITION ${match.repeat}`;
    $('live-tag').textContent=match.status==='complete'?'ON AIR':'PARTIAL RECORD';
    this.render();this.pendingCells();if(autoplay)this.next();
  }
  factionName(f) { return $(f==='f1'?'f1-title':'f2-title').textContent.toUpperCase(); }
  setSpeed(speed) {this.speed=Number(speed);this.timeline?.timeScale(this.speed);}
  setGentle(gentle) {this.gentle=gentle;}
  stop() {this.token++;this.timeline?.kill();this.timeline=null;clearTimeout(this.timer);this.paused=true;}
  toggle() {
    if(!this.match)return;
    if(this.finished){this.load(this.match,this.settings);return;}
    this.paused=!this.paused;
    if(this.timeline)this.paused?this.timeline.pause():this.timeline.resume();
    else {clearTimeout(this.timer);if(!this.paused)this.next();}
    this.onChange(this);
  }
  step() {
    if(!this.match||this.finished)return;
    this.token++;this.timeline?.kill();this.timeline=null;clearTimeout(this.timer);this.paused=true;
    this.cursor++;this.render();this.pendingCells();this.checkEnd();
  }
  finish() {
    if(!this.match)return;
    this.token++;this.timeline?.kill();this.timeline=null;clearTimeout(this.timer);this.paused=true;
    this.cursor=this.match.rows.length;this.render();this.pendingCells();this.checkEnd();
  }
  pendingCells() {
    const cells=[$('cell-left'),$('cell-right')];
    if(globalThis.gsap)gsap.set(cells,{clearProps:'all'});
    for(const el of cells){el.classList.remove('flash');el.querySelector('.cell-letter').textContent=this.finished?'—':'?';el.querySelector('.cell-gain').textContent=this.finished?'MATCH COMPLETE':'DECISION PENDING';}
    $('round-phase').textContent=this.finished?'ENCOUNTER COMPLETE':this.match?(this.paused?'PLAYBACK PAUSED':'DECISIONS LOCKED'):'AWAITING FIRST CONTACT';
  }
  next() {
    if(this.paused||!this.match||this.finished)return;
    if(this.cursor>=this.match.rows.length){this.checkEnd();return;}
    const row=this.match.rows[this.cursor], token=this.token;
    this.pendingCells();$('round-number').textContent=row.round;$('round-phase').textContent='DECISIONS LOCKED';
    const cells=[$('cell-left'),$('cell-right')];
    const reveal=()=>{
      cells.forEach((cell,i)=>{cell.querySelector('.cell-letter').textContent=i?row.right:row.left;cell.querySelector('.cell-gain').textContent=`${(i?row.right:row.left)==='S'?'SHARE':'KEEP'} · +${points(i?row.pointsRight:row.pointsLeft)}`;cell.classList.add('flash');});
      $('round-phase').textContent='SIMULTANEOUS REVEAL';
    };
    const archive=()=>{
      if(token!==this.token)return;
      this.timeline=null;this.cursor++;this.render();this.checkEnd();
      if(!this.finished)this.next();
    };
    if(!globalThis.gsap||this.gentle){
      reveal();this.timer=setTimeout(archive,Math.max(70,600/this.speed));return;
    }
    const stage=$('decision-stage'),w=stage.clientWidth,cellWidth=cells[0].offsetWidth;
    const joins=[w/2-cellWidth-3-cells[0].offsetLeft,w/2+3-cells[1].offsetLeft];
    this.timeline=gsap.timeline({onComplete:archive});this.timeline.timeScale(this.speed);
    this.timeline.fromTo(cells,{opacity:0,scale:.88,y:10,x:0},{opacity:1,scale:1,y:0,duration:.28,ease:'power2.out'});
    this.timeline.to(cells,{y:-6,duration:.3,ease:'sine.inOut'},.28);
    this.timeline.call(reveal,[],.6);
    this.timeline.fromTo(cells.map(c=>c.querySelector('.cell-letter')),{opacity:0,scale:.6},{opacity:1,scale:1,duration:.23,ease:'back.out(1.5)'},.6);
    this.timeline.to(cells,{y:0,duration:.25,ease:'sine.inOut'},.68);
    this.timeline.call(()=>{$('round-phase').textContent='PAYOFF EXCHANGE';},[],1.05);
    this.timeline.to(cells,{x:i=>joins[i],duration:.45,ease:'power2.inOut'},1.05);
    this.timeline.to(cells,{scale:.45,y:-70,opacity:0,duration:.43,ease:'power2.inOut'},1.7);
  }
  checkEnd() {
    if(this.cursor>=this.match.rows.length&&!this.finished){this.finished=true;this.paused=true;this.pendingCells();$('live-tag').textContent=this.match.status==='complete'?'MATCH COMPLETE':'INCOMPLETE';$('match-summary').textContent=`${this.match.rows.length} rounds · ${this.match.endedBy==='probability'?'random ending':this.match.endedBy==='cap'?'round cap reached':this.match.status==='complete'?'fixed length':'incomplete record'}`;this.onChange(this);this.onFinished(this.match);}
  }
  render() {
    if(!this.match)return;
    const shown=this.match.rows.slice(0,this.cursor),last=shown.at(-1);
    $('left-score').textContent=points(last?.totalLeft??0);$('right-score').textContent=points(last?.totalRight??0);
    for(const side of ['left','right'])$(''+side+'-share').textContent=`${shown.length?Math.round(shown.filter(r=>r[side]==='S').length/shown.length*100):0}% SHARED`;
    $('round-number').textContent=shown.length||'—';$('round-limit').textContent=`/ ${this.match.rows.length}`;
    $('history-count').textContent=`${shown.length} ARCHIVED`;$('history-empty').hidden=shown.length>0;
    $('round-ring').style.strokeDashoffset=String(276.46*(1-shown.length/Math.max(1,this.match.rows.length)));
    const box=$('history-rows');box.replaceChildren();
    for(const row of shown.slice(-8)){
      const el=document.createElement('div');el.className='history-row';el.setAttribute('role','row');
      const number=document.createElement('span');number.className='row-number';number.textContent=String(row.round).padStart(3,'0');number.setAttribute('role','cell');el.append(number);
      for(const side of ['left','right']){const cell=document.createElement('div');cell.className=`history-decision faction-${this.match[side].faction}`;cell.setAttribute('role','cell');const letter=document.createElement('b');letter.textContent=row[side];const gain=document.createElement('small');gain.textContent=`+${points(row[side==='left'?'pointsLeft':'pointsRight'])}`;cell.append(letter,gain);el.append(cell);}
      box.append(el);
    }
    if(globalThis.gsap&&!this.gentle&&box.lastElementChild)gsap.fromTo(box.lastElementChild,{opacity:.3,y:8},{opacity:1,y:0,duration:.24/this.speed});
    const max=Math.max(1,last?.totalLeft??0,last?.totalRight??0);
    for(const side of ['left','right']){const key=side==='left'?'totalLeft':'totalRight';let d='M0 66';for(let i=0;i<shown.length;i++)d+=`L${((i+1)/this.match.rows.length*600).toFixed(2)} ${(66-shown[i][key]/max*62).toFixed(2)}`;$(`chart-${side}`).setAttribute('d',d);}
    $('score-chart').setAttribute('aria-label',`Scores after ${shown.length} rounds: ${this.match.left.name} ${points(last?.totalLeft??0)}, ${this.match.right.name} ${points(last?.totalRight??0)}.`);
    $('match-summary').textContent=this.finished?`${this.match.rows.length} rounds · ${this.match.endedBy==='probability'?'random ending':this.match.endedBy==='cap'?'round cap reached':'fixed length'}`:'S = Share · K = Keep';
    this.onChange(this);
  }
}
