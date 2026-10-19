// One durable IndexedDB record per auction; the editor draft is saved with its lots.
window.CatalogStorage = (() => {
  let database;
  const request = r => new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  async function open(){
    if(database)return database;
    const r=indexedDB.open('CMBMultiAuctionCatalog',1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('auctions',{keyPath:'id'});r.result.createObjectStore('settings')};
    database=await request(r);database.onversionchange=()=>{database.close();database=null};return database;
  }
  async function read(store,key){const db=await open();return request(db.transaction(store).objectStore(store).get(key))}
  async function list(){const db=await open();return (await request(db.transaction('auctions').objectStore('auctions').getAll())).map(({id,name,updated,lots})=>({id,name,updated,count:Object.keys(lots||{}).length}))}
  async function save(auction){
    const db=await open();return new Promise((resolve,reject)=>{const t=db.transaction(['auctions','settings'],'readwrite');t.objectStore('auctions').put(auction);t.objectStore('settings').put(auction.id,'active');t.oncomplete=resolve;t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error||new Error('Save cancelled'))})
  }
  async function legacyLots(){
    let lots={};try{lots=JSON.parse(localStorage.getItem('cmbAuctionLots')||'{}')||{}}catch{}
    // Earlier app versions used this separate database. Read without deleting it.
    try{
      const names=await indexedDB.databases?.();
      if(names?.some(d=>d.name==='CMBAuctionCataloger')){
        const old=await request(indexedDB.open('CMBAuctionCataloger'));
        if(old.objectStoreNames.contains('lots'))for(const lot of await request(old.transaction('lots').objectStore('lots').getAll()))if(!lots[lot.lot])lots[lot.lot]=lot;
        old.close();
      }
    }catch{}
    return lots;
  }
  return {open,list,save,get:id=>read('auctions',id),active:()=>read('settings','active'),legacyLots};
})();
