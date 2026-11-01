export const VERSION = 'space-dilemma-tournament-v2';
export const MULTIPLIER_MODES = {
  kk: 'KK only', ss: 'SS only', 'any-k': 'Any K · Keep payoff only',
  'any-s': 'Any S · Share payoff only', full: 'Full payoff matrix'
};
export const MAX_ROUNDS = 5000;
export const FORMAT_NAMES = {
  t1: 'Tournament 1 · cross-faction', cross: 'Cross-faction round robin',
  full: 'Full round robin', survival: 'Winner stays · elimination', duels: 'Selected matches · no elimination'
};
export function normalizeSettings(input) {
  const s = { format: 't1', rounds: 100, multiplier: 1, multiplierMode: 'kk', ending: 'fixed', continuation: 95,
    historyLimit: 0, repeats: 1, selfPlay: false, seed: 'tournament-1', ...input };
  if (!Object.hasOwn(FORMAT_NAMES, s.format)) throw Error('Choose a valid tournament format.');
  if (!Object.hasOwn(MULTIPLIER_MODES, s.multiplierMode)) throw Error('Choose a valid resource multiplier application.');
  if (s.format === 't1') Object.assign(s, { rounds: 100, multiplier: 1, multiplierMode: 'kk', ending: 'fixed', historyLimit: 0, repeats: 1, selfPlay: false });
  for (const [key, min, max] of [['rounds', 1, MAX_ROUNDS], ['historyLimit', 0, MAX_ROUNDS], ['repeats', 1, 20]]) {
    s[key] = Number(s[key]);
    if (!Number.isInteger(s[key]) || s[key] < min || s[key] > max) throw Error(`${key}: enter an integer from ${min} to ${max}.`);
  }
  if (typeof s.multiplier !== 'number' && (typeof s.multiplier !== 'string' || !s.multiplier.trim())) throw Error('Multiplier must be 0–2.');
  s.multiplier = Number(s.multiplier); s.continuation = Number(s.continuation);
  if (!Number.isFinite(s.multiplier) || s.multiplier < 0 || s.multiplier > 2) throw Error('Multiplier must be 0–2.');
  if (!['fixed', 'probability'].includes(s.ending)) throw Error('Choose a valid round ending rule.');
  if (!Number.isFinite(s.continuation) || s.continuation < 0 || s.continuation > 100) throw Error('Continuation must be 0–100%.');
  s.seed = String(s.seed).trim(); if (!s.seed || s.seed.length > 120) throw Error('Enter a seed of 1–120 characters.');
  s.selfPlay = Boolean(s.selfPlay);
  if (s.format === 'survival') s.repeats = 1;
  return s;
}
export function expectedRounds(percent, cap) {
  const p = Number(percent) / 100;
  if (!Number.isFinite(p) || p < 0 || p > 1 || !Number.isInteger(cap) || cap < 1) return null;
  return { uncapped: p === 1 ? Infinity : 1 / (1 - p), capped: p === 1 ? cap : -Math.expm1(cap * Math.log(p)) / (1 - p) };
}
export function payoff(left, right, multiplier, mode = 'kk') {
  if (!['S','K'].includes(left) || !['S','K'].includes(right)) throw Error('Decisions must be S or K.');
  if (!Object.hasOwn(MULTIPLIER_MODES, mode)) throw Error('Choose a valid resource multiplier application.');
  if (!Number.isFinite(multiplier) || multiplier < 0 || multiplier > 2) throw Error('Multiplier must be 0–2.');
  const pair = left + right;
  const multiplyBoth = mode === 'full' || mode === 'kk' && pair === 'KK' || mode === 'ss' && pair === 'SS';
  const base = pair === 'SS' ? [3,3] : pair === 'SK' ? [1,5] : pair === 'KS' ? [5,1] : [2,2];
  return base.map((value,index) => {
    const decision = index === 0 ? left : right;
    const selected = multiplyBoth || mode === 'any-k' && decision === 'K' || mode === 'any-s' && decision === 'S';
    return selected ? value * multiplier : value;
  });
}
export function scoreRound(left, right, multiplier, previous, round, mode = 'kk') {
  const [pointsLeft, pointsRight] = payoff(left, right, multiplier, mode);
  return { round, left, right, pointsLeft, pointsRight,
    totalLeft: (previous?.totalLeft ?? 0) + pointsLeft,
    totalRight: (previous?.totalRight ?? 0) + pointsRight };
}
// Versioned FNV-1a + Mulberry32 streams. Termination never consumes a strategy's RNG.
export function seed32(...parts) {
  let h = 2166136261;
  const serialized = JSON.stringify([VERSION, ...parts]);
  for (let i=0;i<serialized.length;i++) { h ^= serialized.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function randomStream(seed) {
  let state = seed >>> 0;
  return () => { let t = state += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function matchSeeds(settings, pairing) {
  const parts = [settings.seed, pairing.index, pairing.repeat, pairing.left.id, pairing.right.id];
  return { left: seed32(...parts, 'left'), right: seed32(...parts, 'right'), ending: seed32(...parts, 'ending') };
}
export const points = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
