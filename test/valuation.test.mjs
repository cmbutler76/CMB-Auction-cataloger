import test from 'node:test';
import assert from 'node:assert/strict';
import analyze, { normalizeListing } from '../netlify/functions/analyze.mjs';
const listing={title:'Used bag',low:10,high:25,valuationNotes:'Low confidence.',comps:[{title:'Similar bag',price:20,status:'sold',currency:'USD',condition_match:true,date:'',source:'https://example.com/item'}]};
const data={output:[{type:'web_search_call',action:{sources:[{url:'https://example.com/item'}]}}]};
test('preserves prices and missing dates, rejects unsupported comparable URLs',()=>{
 const x=normalizeListing({...listing,comps:[...listing.comps,{...listing.comps[0],source:'https://invented.test/item'}]},data);
 assert.equal(x.low,10);assert.equal(x.high,25);assert.equal(x.comps.length,1);assert.equal(x.comps[0].date,'');
});
test('does not turn unknown values into zero or accept reversed/invalid ranges',()=>{
 for(const [low,high] of [[null,null],[25,10],['10',20],[-5,20]]){
 const x=normalizeListing({...listing,low,high},{});assert.equal(x.low,null);assert.equal(x.high,null);assert.match(x.valuationNotes,/No reliable value range/);
 }
});
test('asking prices stay asking; non-USD, unsafe URLs and unknown prices omitted',()=>{
 const c=listing.comps[0];const x=normalizeListing({...listing,comps:[{...c,status:'asking'},{...c,currency:'EUR'},{...c,price:null},{...c,source:'javascript:alert(1)'}]},data);
 assert.equal(x.comps.length,1);assert.equal(x.comps[0].status,'asking');
});
test('invalid input fails before contacting provider',async()=>{
 assert.equal((await analyze(new Request('http://localhost'))).status,405);
 assert.equal((await analyze(new Request('http://localhost',{method:'POST',body:'invalid'}))).status,400);
 assert.equal((await analyze(new Request('http://localhost',{method:'POST',body:'{"images":[]}'}))).status,400);
});
test('provider request uses structured valuation output, images and source lookup; response includes range',async()=>{
 const fetchBefore=global.fetch,keyBefore=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test-placeholder';
 try{
 global.fetch=async(url,opts)=>{const b=JSON.parse(opts.body);assert.equal(b.text.format.schema.properties.low.type[0],'number');assert.equal(b.tools[0].type,'web_search');assert.ok(b.include.includes('web_search_call.action.sources'));assert.equal(b.input[0].content[1].type,'input_image');return Response.json({...data,output_text:JSON.stringify(listing)});};
 const r=await analyze(new Request('http://localhost',{method:'POST',body:JSON.stringify({images:['data:image/jpeg;base64,AA==']})}));assert.equal(r.status,200);const x=await r.json();assert.equal(x.high,25);assert.equal(x.comps.length,1);
 }finally{global.fetch=fetchBefore;if(keyBefore===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=keyBefore;}
});

test('rejects sealed or complete-set comparables for an incomplete parts lot',()=>{
 const c=listing.comps[0];const x=normalizeListing({...listing,comps:[{...c,title:'New sealed LEGO set',condition_match:false}]},data);
 assert.equal(x.comps.length,0);assert.match(x.valuationNotes,/No source-backed comparable/);
});

test('quick descriptions skip web research but keep preliminary price fields',async()=>{
 const oldFetch=global.fetch,oldKey=process.env.OPENAI_API_KEY;process.env.OPENAI_API_KEY='test';
 try{
  global.fetch=async(url,opts)=>{const b=JSON.parse(opts.body);assert.equal(b.tools,undefined);assert.equal(b.tool_choice,undefined);assert.match(b.input[0].content[0].text,/preliminary/);return Response.json({output_text:JSON.stringify({...listing,comps:[]})});};
  const r=await analyze(new Request('http://localhost',{method:'POST',body:JSON.stringify({mode:'quick',images:['data:image/jpeg;base64,AA==']})}));
  assert.equal(r.status,200);const x=await r.json();assert.equal(x.low,10);assert.equal(x.comps.length,0);
 }finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldKey;}
});
