/* Rebuild portable HTML after editing JSON. Node.js built-ins only.
   Checkout: node tools/build-offline.mjs
   Downloaded package: node build-offline.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const packaged=fs.existsSync(path.join(here,'editable-site'));
const root=packaged?here:path.resolve(here,'..');
const source=path.join(root,packaged?'editable-site':'dist'),out=packaged?root:path.join(root,'portable');
const read=f=>fs.readFileSync(path.join(source,f),'utf8'),data=f=>JSON.parse(read(f));
const course=data('course.json'),lectures=Object.fromEntries(course.lectures.map(m=>[m.id,data(m.file)]));
const template=read('index.html'),css=read('styles.css'),app=read('app.js');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const table=(cols,rows)=>`<table><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const c=data('data/teaching-case.json'),r=data('data/ratio-case.json'),v=data('data/review-case.json');
const money=n=>Math.abs(n).toLocaleString('en-US');
const pine=[['A','Issue shares for $6,000 cash.'],['B','Buy equipment for $2,000 cash.'],['C','Provide services and receive $1,500 cash.'],['D','Receive an unpaid $300 invoice for June utilities.']];
const handout=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Accounting — Teaching case handout</title><style>
*{box-sizing:border-box}body{font:18px/1.5 "Segoe UI",Arial,sans-serif;color:#10283d;background:#eef2f6;margin:0}main{max-width:1000px;margin:32px auto;padding:36px 48px;background:#fff}h1{font-size:36px;line-height:1.15}h2{font-size:28px;border-top:3px solid #276bbd;padding-top:20px;margin-top:42px}h3{font-size:21px}table{border-collapse:collapse;width:100%;margin:20px 0}th,td{text-align:left;vertical-align:top;border-bottom:1px solid #cbd5dc;padding:9px 12px}th{background:#edf3fa}td:first-child{white-space:nowrap}li{margin:6px 0}.muted{color:#4d6170}button{font:inherit;padding:10px 18px;background:#10283d;color:white;border:0;border-radius:3px;cursor:pointer}@media(max-width:650px){main{margin:0;padding:22px}h1{font-size:30px}td,th{font-size:16px;padding:7px}}@media print{@page{margin:15mm}body{background:white;font-size:11pt}main{padding:0;margin:0;max-width:none}button{display:none}h2{break-before:page;margin-top:0}h2:first-of-type{break-before:auto}tr{break-inside:avoid}h1{font-size:24pt}h2{font-size:19pt}th,td{padding:5px 8px}}
</style></head><body><main><button onclick="window.print()">Print handout</button><h1>Accounting<br>Teaching case handout</h1><p class="muted">Fictional practice companies · USD · Companion to the 15 lectures</p><p>Work from source events before revealing slide answers. These cases are separate from the assessed datasets.</p>
<h2>Summit Trail Co.</h2><p>Weeks 1–7 and 9–12 · Outdoor services and equipment retail · June</p><h3>Assumptions</h3><ul>${c.assumptions.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${table(['ID','Date','Transaction'],c.transactions.map(t=>[t.id,t.date,t.description]))}<p>Prepare the journal, ledger, trial balance, and four course statements. Use the stated cash-flow convention and note repayment terms.</p>
<h2>Pine Services Co.</h2><p>Week 8 · June · All opening balances zero. No other events or adjustments.</p>${table(['ID','Event'],pine)}<p>Analyze, journalize, post, and prepare a trial balance. Explain why a balanced wrong-account entry could still mislead a reader.</p>
<h2>Cedar Co.</h2><p>Week 13 · Two full years · USD</p>${table(['Measure','Year 1','Year 2'],[['Revenue','revenue'],['Net income','net_income'],['Beginning assets','beginning_assets'],['Ending assets','ending_assets'],['Ending liabilities','liabilities'],['Ending equity','equity']].map(([name,key])=>[name,money(r.year1[key]),money(r.year2[key])]))}<p>Calculate net profit margin, ROA, liabilities-based debt-to-equity, and asset turnover. Use average beginning and ending assets for ROA and turnover. Explain the changes without assuming universal target ratios.</p>
<h2>Harbor Services Co.</h2><p>Week 15 · June · USD · No adjusting or closing entries. Loan maturity is not supplied.</p><h3>Opening balances</h3>${table(['Account','Debit ($)','Credit ($)'],Object.entries(v.opening_balances).map(([a,n])=>[a,n>0?money(n):'',n<0?money(n):'']))}<h3>June events</h3>${table(['ID','Transaction'],v.transactions.map(t=>[t.id,t.description]))}<p>Connect the four statements, explain profit versus cash, and attempt the independent error challenges in the lecture.</p></main></body></html>`;
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(path.join(out,'lectures'),{recursive:true});
fs.writeFileSync(path.join(source,'case-handout.html'),handout);fs.writeFileSync(path.join(out,'case-handout.html'),handout);
function build(defaultLecture){
 // Include all lectures so a single copied weekly file retains a working menu.
 const json=JSON.stringify({course,lectures,defaultLecture,handout}).replace(/</g,'\\u003c');
 return template.replace('<link rel="stylesheet" href="styles.css">',()=>`<style>\n${css}\n</style>`).replace('<script src="app.js"></script>',()=>`<script>window.ACCOUNTING_BUNDLE=${json};</script>\n<script>\n${app}\n</script>`);
}
fs.writeFileSync(path.join(out,'START-HERE.html'),build(course.lectures[0].id));
if(!packaged)fs.mkdirSync(path.join(source,'offline'),{recursive:true});
for(const m of course.lectures){const html=build(m.id);fs.writeFileSync(path.join(out,'lectures',m.id+'.html'),html);if(!packaged)fs.writeFileSync(path.join(source,'offline',m.id+'.html'),html);}
console.log(`Built the complete course, ${course.lectures.length} weekly HTML files, and the case handout.`);
