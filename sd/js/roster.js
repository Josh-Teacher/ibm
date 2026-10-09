const MAX_SOURCE_BYTES = 256 * 1024;
export async function loadRoster(base = new URL('../', import.meta.url), demo = false) {
  const roster = [];
  for (const faction of ['f2','f1']) {
    const manifestURL = new URL(`${demo ? 'demo/' : ''}${faction}/manifest.json`,base);
    const response = await fetch(manifestURL,{cache:'no-store'});
    if (!response.ok) throw Error(`Cannot load ${demo?'demo/':''}${faction}/manifest.json (${response.status}). Run tools/build_manifest.py and publish the complete folder.`);
    const manifest = await response.json();
    if (!Array.isArray(manifest.strategies)) throw Error(`${faction}/manifest.json needs a strategies array.`);
    for (const entry of manifest.strategies) {
      if (typeof entry.file !== 'string' || !entry.file.endsWith('.py') || /[/\\]/.test(entry.file) || entry.file === '.' || entry.file === '..') throw Error(`Invalid Python filename in ${faction}/manifest.json.`);
      const fileURL = new URL(encodeURIComponent(entry.file), manifestURL);
      const result = await fetch(fileURL,{cache:'no-store'});
      if (!result.ok) throw Error(`Cannot load ${faction}/${entry.file} (${result.status}). Check the filename and capitalization.`);
      const source = await result.text();
      if (new TextEncoder().encode(source).length > MAX_SOURCE_BYTES) throw Error(`${faction}/${entry.file} exceeds 256 KiB.`);
      if (/^\s*<!doctype html/i.test(source)) throw Error(`${faction}/${entry.file} returned an HTML page instead of Python.`);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source))),b=>b.toString(16).padStart(2,'0')).join('');
      roster.push({ id:`${faction}/${entry.file}`, faction, name:String(entry.name || entry.file.replace(/\.py$/,'')), filename:`${faction}/${entry.file}`, source, hash, demo });
    }
  }
  if (new Set(roster.map(s=>s.id)).size !== roster.length) throw Error('A strategy filename appears more than once in the manifests.');
  return roster;
}
