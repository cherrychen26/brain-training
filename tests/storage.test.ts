import {localDay} from '../src/domain/random';
import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {readData,writeData,storeImport,latestSnapshot} from '../src/storage/db';
import {newData,startSession,play,pause} from '../src/domain/training';
it('IndexedDB 实际保存棋盘，读取时自动暂停且不丢进度',async()=>{let data=startSession(newData(),localDay(),'schulte');const state=data.active!.round!.state;if(state.kind!=='schulte')throw Error();data=play(data,{type:'cell',index:state.cells.indexOf(1)});await writeData(data);const loaded=await readData();expect(loaded.active!.paused).toBe(true);expect(loaded.active!.round!.state).toEqual(data.active!.round!.state)});
it('导入存档和导入前快照在同一事务内保存',async()=>{const old=pause(startSession(newData(),localDay(),'sudoku'),true),next=newData();next.settings.largeText=true;await storeImport(next,old);expect((await readData()).settings.largeText).toBe(true);expect((await latestSnapshot())!.data).toEqual(old)});
