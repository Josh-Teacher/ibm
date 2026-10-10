const MAX_SOURCE_BYTES = 256 * 1024;
const siteBase = () => new URL('../', import.meta.url);
function validateEntries(entries, label) {
  if (!Array.isArray(entries)) throw Error(`${label} needs a strategies array.`);
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry.file !== 'string' || !entry.file.endsWith('.py') || entry.file.length <= 3 || /[/\\\u0000-\u001f]/.test(entry.file)) throw Error(`Invalid Python filename in ${label}.`);
    if (seen.has(entry.file)) throw Error(`Duplicate strategy in ${label}: ${entry.file}`);
    seen.add(entry.file);
  }
}
async function readManifests(base, demo = false) {
  const pairs = await Promise.all(['f2','f1'].map(async faction => {
    const path = `${demo?'demo/':''}${faction}/manifest.json`;
    const response = await fetch(new URL(path,base),{cache:'no-store'});
    if (!response.ok) throw Error(`Cannot load ${path} (${response.status}). Publish both faction manifests.`);
    const manifest = await response.json();
    if (!manifest || typeof manifest !== 'object') throw Error(`Invalid ${path}.`);
    if (manifest.classes !== undefined) {
      if (!manifest.classes || typeof manifest.classes !== 'object' || Array.isArray(manifest.classes)) throw Error(`${path} needs a classes object.`);
      for (const [id,section] of Object.entries(manifest.classes)) {
        if (!id || ['all','demo'].includes(id) || !section || typeof section.name !== 'string' || !section.name.trim()) throw Error(`Invalid class identifier or name in ${path}.`);
        validateEntries(section.strategies,`${path} / ${id}`);
      }
    } else validateEntries(manifest.strategies,path);
    return [faction,manifest];
  }));
  const manifests = Object.fromEntries(pairs), left = manifests.f2.classes, right = manifests.f1.classes;
  if (Boolean(left) !== Boolean(right)) throw Error('Both faction manifests must use the same class structure.');
  if (left) {
    const ids = Object.keys(left);
    if (ids.length !== Object.keys(right).length || ids.some(id => !Object.hasOwn(right,id))) throw Error('Both faction manifests must list the same class identifiers.');
    if (ids.some(id => left[id].name !== right[id].name)) throw Error('Class names must match in both faction manifests.');
  }
  return manifests;
}
export async function loadClassCatalog(base = siteBase()) {
  const manifests = await readManifests(base);
  return Object.entries(manifests.f2.classes??{}).map(([id,section])=>({id,name:section.name}));
}
export async function loadRoster(base = siteBase(), demo = false, section = null) {
  const roster = [], manifests = await readManifests(base,demo);
  const selected = !demo && section?.id && section.id !== 'all' ? section.id : null;
  for (const faction of ['f2','f1']) {
    const manifest = manifests[faction];
    let entries;
    if (selected) {
      if (!manifest.classes || !Object.hasOwn(manifest.classes,selected)) throw Error(`Class ${selected} is missing from ${faction}/manifest.json.`);
      entries = manifest.classes[selected].strategies;
    } else if (manifest.classes) {
      entries = [...new Map(Object.values(manifest.classes).flatMap(c=>c.strategies).map(s=>[s.file,s])).values()];
    } else entries = manifest.strategies;
    for (const entry of entries) {
      const result = await fetch(new URL(`${demo?'demo/':''}${faction}/${encodeURIComponent(entry.file)}`,base),{cache:'no-store'});
      if (!result.ok) throw Error(`Cannot load ${faction}/${entry.file} (${result.status}). Check the filename and capitalization.`);
      const source = await result.text();
      if (new TextEncoder().encode(source).length > MAX_SOURCE_BYTES) throw Error(`${faction}/${entry.file} exceeds 256 KiB.`);
      if (/^\s*<!doctype html/i.test(source)) throw Error(`${faction}/${entry.file} returned an HTML page instead of Python.`);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source))),b=>b.toString(16).padStart(2,'0')).join('');
      roster.push({id:`${faction}/${entry.file}`,faction,name:String(entry.name||entry.file.replace(/\.py$/,'')),filename:`${faction}/${entry.file}`,source,hash,demo});
    }
  }
  return roster;
}
