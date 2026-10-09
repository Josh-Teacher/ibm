/* One isolated interpreter per competitor, replaced before each match. */
const BASE = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
let py;
(async () => {
  try {
    postMessage({stage:'Loading Python runtime…'});
    try { importScripts(BASE+'pyodide.js'); py = await loadPyodide({indexURL:BASE,stdout:()=>{},stderr:()=>{}}); }
    catch (error) { throw Error('Python runtime download failed. Check access to cdn.jsdelivr.net. '+error.message); }
    const url = new URL('../runner.py',self.location.href);
    const response = await fetch(url,{cache:'no-store'});
    if (!response.ok) throw Error(`The site is missing runner.py (${response.status}). Publish runner.py beside index.html; it is included in the viewer download.`);
    const code = await response.text();
    if (/^\s*<!doctype html/i.test(code)) throw Error('runner.py returned HTML. Check the published folder structure.');
    py.runPython(code);
    postMessage({ready:true});
  } catch (error) { postMessage({fatal:error.message}); }
})();
onmessage = ({data}) => {
  try { py.globals.set('_request_json',JSON.stringify(data)); postMessage({id:data.id,...JSON.parse(py.runPython('handle(_request_json)'))}); }
  catch (error) { postMessage({id:data.id,error:error.message}); }
};
