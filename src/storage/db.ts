import {openDB,type DBSchema} from 'idb';
import type {AppData} from '../domain/types';
import {newData} from '../domain/training';
import {migrateData} from './migrate';
interface GymDB extends DBSchema {state:{key:string;value:AppData};snapshots:{key:string;value:{createdAt:string;data:AppData}}}
const connect=()=>openDB<GymDB>('daily-brain-gym',1,{upgrade(db){db.createObjectStore('state');db.createObjectStore('snapshots')}});
export async function readData(){const db=await connect();const data=await db.get('state','main');if(data?.schemaVersion===1){await db.put('snapshots',{createdAt:new Date().toISOString(),data:structuredClone(data)},`migration-v1-${crypto.randomUUID()}`)}return migrateData(data??newData())}
export async function writeData(data:AppData){const db=await connect();await db.put('state',structuredClone(data),'main')}
export async function storeImport(data:AppData,previous:AppData){const db=await connect(),tx=db.transaction(['state','snapshots'],'readwrite');const createdAt=new Date().toISOString();await tx.objectStore('snapshots').put({createdAt,data:structuredClone(previous)},`${createdAt}-${crypto.randomUUID()}`);await tx.objectStore('state').put(structuredClone(data),'main');await tx.done}
export async function latestSnapshot(){const db=await connect();const keys=await db.getAllKeys('snapshots');const key=keys.sort().at(-1);return key?(await db.get('snapshots',key))??null:null}
