const DB_NAME='my-toolbox';const DB_VERSION=1;
const STORES=['memos','todos','shopping','diaries','habits','favorites','history','calculations','settings'];
export function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{const db=r.result;STORES.forEach(s=>{if(!db.objectStoreNames.contains(s))db.createObjectStore(s,{keyPath:'id',autoIncrement:true})})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
export async function put(store,value){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(store,'readwrite');const req=tx.objectStore(store).put(value);req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error)})}
export async function getAll(store){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store).objectStore(store).getAll();r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
export async function clear(store){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store,'readwrite').objectStore(store).clear();r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export async function remove(store,id){const db=await openDB();return new Promise((res,rej)=>{const r=db.transaction(store,'readwrite').objectStore(store).delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
export {STORES};
