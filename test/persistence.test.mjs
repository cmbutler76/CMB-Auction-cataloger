import {parseHTML} from 'linkedom';
import {indexedDB} from 'fake-indexeddb';
import {readFileSync} from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8'),js=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const legacy={7:{lot:7,title:'Previous auction item',photos:[{data:'legacy-photo',main:true}],comps:[],low:'10',high:'20'}};
async function boot(){
 const {document}=parseHTML(html);Object.defineProperty(Object.getPrototypeOf(document.createElement('select')),'value',{get(){return this._value||''},set(v){this._value=String(v)},configurable:true});
 const c={document,indexedDB,crypto:{randomUUID},structuredClone,console,URL,Blob,navigator:{},localStorage:{getItem:()=>JSON.stringify(legacy)},confirm:()=>true,alert:()=>{},addEventListener:()=>{},fetch:async()=>({ok:true,json:async()=>({title:'AI test',low:10,high:20,valuationNotes:'Test',comps:[]})})};c.window=c;
 const ctx=vm.createContext(c);vm.runInContext(readFileSync(new URL('../storage.js',import.meta.url),'utf8'),ctx);vm.runInContext(js,ctx);
 for(let i=0;i<100 && !vm.runInContext('ready',ctx);i++)await new Promise(r=>setTimeout(r,5));assert.equal(vm.runInContext('ready',ctx),true);return {ctx,document};
}
let {ctx,document}=await boot();const run=s=>vm.runInContext(s,ctx);
assert.equal(document.getElementById('title').value,'Previous auction item');assert.equal(run('photos[0].data'),'legacy-photo');
const first=run('auction.id');document.getElementById('description').value='Edited without Save Lot';await run('persist()');
({ctx,document}=await boot());assert.equal(document.getElementById('description').value,'Edited without Save Lot');assert.equal(run('photos[0].data'),'legacy-photo');assert.equal(document.getElementById('lotNo').textContent,'7');
document.getElementById('newAuctionName').value='Second auction';await run('createAuction()');assert.equal(document.getElementById('lotNo').textContent,'1');assert.equal(document.getElementById('title').value,'');
const second=run('auction.id');document.getElementById('title').value='Auction two lot one';await run('persist()');await run('saveLot(true)');assert.equal(document.getElementById('lotNo').textContent,'2');
await run(`$('auctionSelect').onchange({target:{value:${JSON.stringify(first)}}})`);assert.equal(document.getElementById('title').value,'Previous auction item');assert.equal(document.getElementById('description').value,'Edited without Save Lot');
await run(`$('auctionSelect').onchange({target:{value:${JSON.stringify(second)}}})`);assert.equal(document.getElementById('lotNo').textContent,'2');await run('openLot(1)');assert.equal(document.getElementById('title').value,'Auction two lot one');
({ctx,document}=await boot());assert.equal(run('auction.id'),second);assert.equal(document.getElementById('title').value,'Auction two lot one');
const originalTitle=document.getElementById('title').value;
run("prepareAIRequest=async()=>JSON.stringify({images:[]});photos=[{data:'test-fixture',main:true}]");
await run('generateAIListing(true)');await run('saveQueue');
assert.equal(document.getElementById('title').value,originalTitle);assert.equal(document.getElementById('low').value,'10');assert.equal(document.getElementById('high').value,'20');
run("CatalogStorage.save=async()=>{throw Error('quota')}");await run('saveLot(true)');assert.equal(document.getElementById('lotNo').textContent,'1');assert.equal(document.getElementById('title').value,'Auction two lot one');assert.match(document.getElementById('status').textContent,/SAVE FAILED/);
console.log('PASS: legacy migration, unsaved edits restore after reopen, photos restore, auction isolation, numbering, saved lot reopening, active auction restore, failed save does not advance/clear.');
