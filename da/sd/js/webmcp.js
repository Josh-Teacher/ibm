/** Optional browser-standard tools use exactly the visible viewer actions. */
export function registerViewerTools(viewer) {
  const context=document.modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  const tools=[{
    name:'read_tournament_state',title:'Read tournament state',description:'Read the loaded roster, applied settings, completed standings, and playback position.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:true},
    execute(input){if(!input||Object.keys(input).length)throw Error('No parameters are accepted.');const s=viewer.state;return {settings:s.settings,active:s.active,computing:s.computing,roster:s.roster.map(t=>({id:t.id,name:t.name,faction:t.faction})),completedMatches:s.tournament?.matches.length??0,standings:s.tournament?.standings()??null,playback:{match:viewer.playback.match?.index??null,roundsShown:viewer.playback.cursor,paused:viewer.playback.paused}};}
  },{
    name:'control_tournament_playback',title:'Control match playback',description:'Pause, resume, step one round, or finish the visible match. Finishing archives it and follows the visible Auto next setting.',
    inputSchema:{type:'object',properties:{action:{type:'string',enum:['pause','resume','step','finish']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},
    execute(input){if(!input||Object.keys(input).some(k=>k!=='action')||!['pause','resume','step','finish'].includes(input.action))throw Error('Choose pause, resume, step, or finish.');const p=viewer.playback;if(!p.match||viewer.state.computing)throw Error('No recorded match is available.');if(input.action==='pause'&&!p.paused)p.toggle();if(input.action==='resume'&&p.paused&&!p.finished)p.toggle();if(input.action==='step')p.step();if(input.action==='finish')p.finish();return {roundsShown:p.cursor,paused:p.paused,finished:p.finished};}
  }];
  for(const tool of tools)try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
