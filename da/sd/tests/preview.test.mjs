import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM,VirtualConsole} from 'jsdom';
import {parseReplay} from '../js/exports.js';
const record=fs.readFileSync(new URL('../demo/tournament-replay.json',import.meta.url),'utf8');
test('actual T1 example reconciles nine 100-round Python matches',()=>{const t=parseReplay(record).tournament;assert.equal(t.settings.format,'t1');assert.equal(t.matches.length,9);assert.ok(t.matches.every(m=>m.rows.length===100));const total=t.matches.reduce((sum,m)=>sum+m.rows.at(-1).totalLeft+m.rows.at(-1).totalRight,0);assert.equal(t.standings().teams.reduce((sum,s)=>sum+s.points,0),total);assert.equal(t.standings().factions.f1.rounds,900);assert.equal(t.standings().factions.f2.rounds,900);});
test('standalone preview executes offline, replays and remains read-only after setup changes',async()=>{
  const errors=[],console=new VirtualConsole();console.on('jsdomError',e=>errors.push(e));let fetches=0;
  const html=fs.readFileSync(new URL('../../Space_Dilemma_Tournament_Preview.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'file:///tmp/tournament-preview.html',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:console,beforeParse(win){win.matchMedia=()=>({matches:false});win.fetch=()=>{fetches++;throw Error('Preview must not fetch.');};win.HTMLDialogElement.prototype.showModal=function(){this.open=true;};win.HTMLDialogElement.prototype.close=function(){this.open=false;};}});
  try{
    const win=dom.window,$=id=>win.document.getElementById(id);assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));const viewer=win.TournamentPreview.viewer;
    assert.equal(viewer.state.imported,true);assert.equal($('competition-settings').disabled,true);assert.equal($('start').disabled,true);assert.equal($('reload-roster').hidden,true);assert.equal($('f2-roster').children.length,3);
    viewer.playback.toggle();assert.equal(viewer.playback.paused,true);$('step').click();assert.equal($('history-rows').children.length,1);$('skip-match').click();assert.equal($('history-count').textContent,'100 ARCHIVED');assert.equal(viewer.state.tournament.matches.length,9);
    $('profile').value='solar';$('seed').value='cannot-change-replay';$('settings-form').dispatchEvent(new win.Event('submit',{cancelable:true}));assert.equal(viewer.state.imported,true);assert.equal(viewer.state.settings.seed,'tournament-1-demo');assert.equal(win.document.body.dataset.profile,'solar');assert.equal($('start').disabled,true);
    $('schedule-view').querySelector('button.complete').click();assert.equal(viewer.playback.cursor,0);assert.equal(viewer.state.tournament.matches.length,9);assert.equal(fetches,0);assert.equal(errors.length,0,errors.map(e=>e.message).join('\n'));
    viewer.playback.stop();win.gsap.globalTimeline.clear();win.gsap.ticker.sleep();
  }finally{dom.window.close();}
});
