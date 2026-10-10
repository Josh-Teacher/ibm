const MAX_SOURCE_BYTES = 256 * 1024;
const siteBase = () => new URL('../', import.meta.url);
function basename(file, extension) {
  return typeof file === 'string' && file.endsWith(extension) && !/[/\\\u0000-\u001f]/.test(file) && file.length > extension.length;
}
export async function loadClassCatalog(base = siteBase()) {
  const response = await fetch(new URL('classes/index.json',base),{cache:'no-store'});
  if (!response.ok) throw Error(`Cannot load classes/index.json (${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data.classes)) throw Error('classes/index.json needs a classes array.');
  const ids = new Set(['all','demo']);
  return data.classes.map(entry => {
    if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id) || typeof entry.name !== 'string' || !entry.name.trim() || !basename(entry.manifest,'.json')) {
      throw Error('Each class needs a unique id, a name, and a JSON filename in classes/.');
    }
    ids.add(entry.id);
    return {id:entry.id,name:entry.name,manifest:entry.manifest};
  });
}
export async function loadRoster(base = siteBase(), demo = false, section = null) {
  const roster = [];
  let classManifest = null;
  if (!demo && section?.manifest) {
    if (!basename(section.manifest,'.json')) throw Error('Choose a class manifest from classes/index.json.');
    const response = await fetch(new URL('classes/'+encodeURIComponent(section.manifest),base),{cache:'no-store'});
    if (!response.ok) throw Error(`Cannot load classes/${section.manifest} (${response.status}).`);
    classManifest = await response.json();
    if (!Array.isArray(classManifest.f1) || !Array.isArray(classManifest.f2)) throw Error(`classes/${section.manifest} needs f1 and f2 strategy arrays.`);
  }
  for (const faction of ['f2','f1']) {
    let entries;
    if (classManifest) entries = classManifest[faction];
    else {
      const manifestURL = new URL(`${demo ? 'demo/' : ''}${faction}/manifest.json`,base);
      const response = await fetch(manifestURL,{cache:'no-store'});
      if (!response.ok) throw Error(`Cannot load ${demo?'demo/':''}${faction}/manifest.json (${response.status}). Run tools/build_manifest.py and publish the complete folder.`);
      const manifest = await response.json();
      if (!Array.isArray(manifest.strategies)) throw Error(`${faction}/manifest.json needs a strategies array.`);
      entries = manifest.strategies;
    }
    for (const entry of entries) {
      if (!entry || !basename(entry.file,'.py')) throw Error(`Invalid Python filename in the ${faction} manifest.`);
      const fileURL = new URL(`${demo?'demo/':''}${faction}/${encodeURIComponent(entry.file)}`,base);
      const result = await fetch(fileURL,{cache:'no-store'});
      if (!result.ok) throw Error(`Cannot load ${faction}/${entry.file} (${result.status}). Check the filename and capitalization.`);
      const source = await result.text();
      if (new TextEncoder().encode(source).length > MAX_SOURCE_BYTES) throw Error(`${faction}/${entry.file} exceeds 256 KiB.`);
      if (/^\s*<!doctype html/i.test(source)) throw Error(`${faction}/${entry.file} returned an HTML page instead of Python.`);
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(source))),b=>b.toString(16).padStart(2,'0')).join('');
      roster.push({ id:`${faction}/${entry.file}`, faction, name:String(entry.name || entry.file.replace(/\.py$/,'')), filename:`${faction}/${entry.file}`, source, hash, demo });
    }
  }
  if (new Set(roster.map(s=>s.id)).size !== roster.length) throw Error('A strategy filename appears more than once in the selected manifests.');
  return roster;
}
