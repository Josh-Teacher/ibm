import {normalizeSettings} from './rules.js';

const pair = (left, right, repeat, index) => ({ left, right, repeat, index });
export function normalizeOrder(roster, input = {}) {
  const result = {};
  for (const faction of ['f2','f1']) {
    const ids = roster.filter(s => s.faction === faction).map(s => s.id);
    const order = input[faction] ?? ids;
    if (!Array.isArray(order) || order.length !== ids.length || new Set(order).size !== ids.length || order.some(id => !ids.includes(id))) {
      throw Error(`The ${faction.toUpperCase()} play order must contain every strategy exactly once.`);
    }
    result[faction] = [...order];
  }
  return result;
}
export function makeSchedule(roster, settings, queue = []) {
  const f1 = roster.filter(s => s.faction === 'f1'), f2 = roster.filter(s => s.faction === 'f2');
  const base = [];
  if (['t1','cross'].includes(settings.format)) {
    for (const left of f2) for (const right of f1) base.push([left, right]);
  } else if (settings.format === 'full') {
    for (let i = 0; i < roster.length; i++) for (let j = settings.selfPlay ? i : i+1; j < roster.length; j++) {
      let left = roster[i], right = roster[j];
      if (left.faction === 'f1' && right.faction === 'f2') [left,right] = [right,left];
      base.push([left,right]);
    }
  } else if (settings.format === 'duels') {
    for (const q of queue) {
      const left = roster.find(s => s.id === q.left), right = roster.find(s => s.id === q.right);
      if (!left || !right || left.faction !== 'f2' || right.faction !== 'f1') throw Error('Every selected match needs one strategy from each faction.');
      base.push([left,right]);
    }
    if (!base.length) throw Error('Add at least one selected match to the queue.');
  }
  const result = [];
  for (let repeat = 1; repeat <= settings.repeats; repeat++) for (const [l,r] of base) result.push(pair(l,r,repeat,result.length+1));
  if (result.length > 5000) throw Error('This schedule exceeds 5,000 matches. Reduce the roster or repetitions.');
  return result;
}

export class Tournament {
  constructor(roster, input, queue, order) {
    this.settings = normalizeSettings(input);
    this.roster = roster.map(s => ({...s}));
    for (const faction of ['f1','f2']) if (!roster.some(s => s.faction === faction)) throw Error(`Load at least one strategy in ${faction}/.`);
    if (roster.filter(s => s.faction === 'f1').length !== roster.filter(s => s.faction === 'f2').length) throw Error('Both factions must have the same number of strategies.');
    if (new Set(roster.map(s => s.id)).size !== roster.length) throw Error('Strategy IDs must be unique.');
    this.order = normalizeOrder(this.roster, order);
    this.section = {id:'all',name:'All strategies'};
    this.trial = false;
    this.schedule = makeSchedule(this.roster, this.settings, queue);
    this.matches = []; this.alive = new Set(roster.map(s => s.id)); this.champion = null;
    this.pendingTie = null; this.winner = null;
    this.created = new Date().toISOString(); this.status = 'ready';
  }
  nextPair(leftId, rightId) {
    if (this.pendingTie) throw Error('Resolve the tied match before proceeding.');
    if (this.winner || (this.settings.format !== 'survival' && this.matches.length >= this.schedule.length)) return null;
    if (this.settings.format !== 'survival') return this.schedule[this.matches.length];
    const choose = (faction, id) => {
      if (this.champion?.faction === faction) return this.champion;
      const candidates = this.order[faction].filter(id => this.alive.has(id)).map(id => this.roster.find(s => s.id === id));
      return candidates.find(s => s.id === id) ?? candidates[0];
    };
    const left = choose('f2',leftId), right = choose('f1',rightId);
    if (!left || !right) return null;
    return pair(left,right,1,this.matches.length+1);
  }
  commit(match) {
    if (match.status !== 'complete') throw Error('An incomplete match cannot enter the standings.');
    if (match.index !== this.matches.length+1 || this.pendingTie) throw Error('Match order is inconsistent.');
    this.matches.push(match);
    const last = match.rows.at(-1);
    if (this.settings.format === 'survival') {
      if (Math.abs(last.totalLeft-last.totalRight) < 1e-8) { this.pendingTie = match; this.status = 'tie'; return; }
      this.advance(last.totalLeft > last.totalRight ? match.left.id : match.right.id, match, false);
    } else if (this.matches.length === this.schedule.length) { this.status = 'complete'; this.winner = this.scoringWinner(); }
    else this.status = 'between';
  }
  advance(winnerId, match = this.pendingTie, instructorDecision = true) {
    if (!match || ![match.left.id,match.right.id].includes(winnerId)) throw Error('Select one of the tied strategies to advance.');
    const winner = winnerId === match.left.id ? match.left : match.right;
    const loser = winnerId === match.left.id ? match.right : match.left;
    this.champion = winner; this.alive.delete(loser.id); this.pendingTie = null;
    match.advancement = { winner: winner.id, eliminated: loser.id, instructorDecision };
    const oppositionAlive = this.roster.some(s => s.faction !== winner.faction && this.alive.has(s.id));
    this.status = oppositionAlive ? 'between' : 'complete';
    if (!oppositionAlive) this.winner = winner.faction;
  }
  scoringWinner() {
    const totals = this.standings().factions;
    return Math.abs(totals.f1.points-totals.f2.points) < 1e-8 ? 'tie' : totals.f1.points > totals.f2.points ? 'f1' : 'f2';
  }
  standings() { return aggregate(this.roster,this.matches); }
  get totalMatches() { return this.settings.format === 'survival' ? this.roster.length-1 : this.schedule.length; }
}

export function aggregate(roster, matches) {
  const teams = new Map(roster.map(s => [s.id,{id:s.id,name:s.name,faction:s.faction,points:0,rounds:0,matches:0,shares:0,wins:0,ties:0}]));
  for (const match of matches) {
    if (match.status !== 'complete' || !match.rows.length) continue;
    const last = match.rows.at(-1), n = match.rows.length;
    const l = teams.get(match.left.id), r = teams.get(match.right.id);
    if (l === r) {
      // A twin is one scheduled opponent; credit the mean of its two independent seats once.
      l.points += (last.totalLeft+last.totalRight)/2; l.rounds += n; l.matches++;
      l.shares += match.rows.reduce((sum,row) => sum + (row.left === 'S')/2 + (row.right === 'S')/2,0);
      l.ties++;
    } else {
      l.points += last.totalLeft; r.points += last.totalRight; l.rounds += n; r.rounds += n; l.matches++; r.matches++;
      l.shares += match.rows.filter(row => row.left === 'S').length; r.shares += match.rows.filter(row => row.right === 'S').length;
      if (Math.abs(last.totalLeft-last.totalRight) < 1e-8) { l.ties++; r.ties++; }
      else (last.totalLeft > last.totalRight ? l : r).wins++;
    }
  }
  const ranked = [...teams.values()].sort((a,b) => b.points-a.points || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  ranked.forEach((s,i) => { s.rank = i && Math.abs(s.points-ranked[i-1].points) < 1e-8 ? ranked[i-1].rank : i+1; s.averageMatch = s.matches ? s.points/s.matches : 0; s.averageRound = s.rounds ? s.points/s.rounds : 0; });
  const factions = Object.fromEntries(['f1','f2'].map(f => [f,{points:0,rounds:0,shares:0,strategies:roster.filter(s=>s.faction===f).length}]));
  for (const team of ranked) for (const key of ['points','rounds','shares']) factions[team.faction][key] += team[key];
  return {teams:ranked,factions};
}
