// Executes the unchanged browser worker against the pinned local Pyodide bytes.
const {parentPort,workerData}=require('node:worker_threads');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),{fileURLToPath}=require('node:url');
const home=process.env.PYODIDE_HOME||path.join(__dirname,'../node_modules/pyodide');
const {loadPyodide}=require(path.join(home,'pyodide.js'));
global.self=global;global.location={href:workerData.url};
global.importScripts=()=>{global.loadPyodide=opts=>loadPyodide({...opts,indexURL:home});};
global.fetch=async url=>{try{return new Response(fs.readFileSync(fileURLToPath(url)));}catch{return new Response('',{status:404});}};
global.postMessage=data=>parentPort.postMessage(data);
parentPort.on('message',data=>global.onmessage({data}));
vm.runInThisContext(fs.readFileSync(fileURLToPath(workerData.url),'utf8'),{filename:workerData.url});
