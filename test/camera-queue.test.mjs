import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {IDBFactory} from 'fake-indexeddb';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const storage=readFileSync(new URL('../storage.js',import.meta.url),'utf8');
async function boot(indexedDB){
 const {document}=parseHTML(html);
 Object.defineProperty(Object.getPrototypeOf(document.createElement('select')),'value',{get(){return this._value||''},set(v){this._value=String(v)},configurable:true});
 const dialog=document.getElementById('cameraDialog');dialog.showModal=()=>dialog.open=true;dialog.close=()=>dialog.open=false;
 const video=document.getElementById('cameraPreview');video.play=async()=>{};video.videoWidth=1200;video.videoHeight=900;
 let shots=0,stops=0,requests=0;
 const create=document.createElement.bind(document);document.createElement=(tag)=>{const el=create(tag);if(tag==='canvas'){el.getContext=()=>({drawImage(){}});el.toDataURL=()=>`data:image/jpeg;base64,photo${++shots}`}return el};
 const navigator={onLine:false,mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){stops++}}]})}};
 const c={document,indexedDB,crypto:{randomUUID},structuredClone,console,URL,Blob,navigator,localStorage:{getItem:()=>null},confirm:()=>true,alert:()=>{},addEventListener:()=>{},fetch:async(url,options)=>{requests++;assert.equal(JSON.parse(options.body).mode,'quick');return {ok:true,json:async()=>({title:'AI title',description:'AI description',condition:'Used',low:5,high:15,valuationNotes:'Preliminary',comps:[]})}}};c.window=c;
 const ctx=vm.createContext(c),run=s=>vm.runInContext(s,ctx);
 run(storage);run(script);
 for(let i=0;i<100&&!run('ready');i++)await new Promise(r=>setTimeout(r,5));
 assert.equal(run('ready'),true);
 run("prepareAIRequest=async(lot,photos,mode)=>JSON.stringify({lot,images:photos,mode})");
 return {run,document,navigator,stops:()=>stops,requests:()=>requests};
}
test('offline continuous camera saves two shots, stays ready, and queued lots survive reopen',async()=>{
 const db=new IDBFactory();let app=await boot(db);const first=app.run('auction.id');
 await app.run('openCamera()');assert.equal(app.document.getElementById('cameraDialog').open,true);
 await app.run('capturePhoto()');await app.run('capturePhoto()');
 assert.equal(app.run('photos.length'),2);assert.equal(app.document.getElementById('capturePhoto').disabled,false);
 assert.equal(app.document.getElementById('cameraDialog').open,true);assert.equal(app.requests(),0);
 await app.run('saveLot(true)');assert.ok(app.stops()>0);
 app=await boot(db);assert.equal(app.run('auction.id'),first);assert.equal(app.run('lots[1].photos.length'),2);assert.equal(app.run('lots[1].aiPending'),true);
 await app.run('openCamera()');await app.run('capturePhoto()');await app.run('closeCamera()');await app.run('saveLot(true)');
 app.navigator.onLine=true;await app.run('processAIQueue()');
 assert.equal(app.requests(),2);assert.equal(app.run('lots[1].description'),'AI description');assert.equal(app.run('lots[2].description'),'AI description');assert.equal(app.run('lots[1].aiPending'),false);
 app=await boot(db);assert.equal(app.run('lots[1].description'),'AI description');assert.equal(app.run('lots[1].photos.length'),2);
});
test('queue keeps existing descriptions and failed requests remain queued',async()=>{
 const app=await boot(new IDBFactory());
 await app.run('openCamera()');await app.run('capturePhoto()');app.run("$('description').value='Handwritten description'");await app.run('closeCamera()');await app.run('saveLot(true)');
 await app.run('openCamera()');await app.run('capturePhoto()');await app.run('closeCamera()');await app.run('saveLot(true)');
 app.navigator.onLine=true;app.run("fetch=async()=>{throw Error('Network unavailable')}");await app.run('processAIQueue()');
 assert.equal(app.run('lots[1].description'),'Handwritten description');assert.equal(app.run('lots[2].aiPending'),true);assert.equal(app.run('lots[2].photos.length'),1);
});
