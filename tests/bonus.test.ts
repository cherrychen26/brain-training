import {confirmRound,startSession as rawStart,nextRound as rawNext} from '../src/domain/session';
import type {AppData as RunningData,GameId as RunningGame} from '../src/domain/types';
const startSession=(d:RunningData,day?:string,id?:RunningGame)=>confirmRound(rawStart(d,day,id));
const nextRound=(d:RunningData)=>confirmRound(rawNext(d));
import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {newData,finishRound,tick,pause,endSession,rollover,dailyUsed,trainingGroup} from '../src/domain/session';
import type {AppData,Outcome} from '../src/domain/types';
import {questionSignature} from '../src/games/signature';
import {validState} from '../src/storage/validate';
import {migrateData} from '../src/storage/migrate';
import {exportBackup,parseBackup,mergeBackup} from '../src/storage/backup';
import {writeData,readData} from '../src/storage/db';
import {localDay} from '../src/domain/random';
const day=localDay();
function first(total:number,outcome:Outcome='completed',input=startSession(newData(),day)){
 let d=input;const count=d.active!.bonus!.firstCount;
 for(let i=0;i<count;i++){
  // Deterministic completed-round fixture: the engine's actual judging is covered separately.
  const duration=i===count-1?total-(total/count)*(count-1):total/count;
  d.active!.round!.elapsed=duration;d.active!.elapsed+=duration;
  d=finishRound(d,i===0?outcome:'completed');if(i<count-1)d=nextRound(d);
 }
 return d;
}
for(const seconds of [179,180,181])it(`${seconds}秒严格边界`,()=>{const d=first(seconds);expect(d.active!.bonus!.generated).toBe(seconds<180);expect(d.active!.finished).toBe(seconds>=180);expect(d.active!.elapsed).toBeCloseTo(seconds)});
for(const outcome of ['skipped','timeout'] as const)it(`${outcome}不触发`,()=>{const d=first(100,outcome);expect(d.active!.finished).toBe(true);expect(d.active!.bonus!.generated).toBe(false)});
it('提前结束、异常退出恢复均不触发；正常暂停不计时',()=>{
 let d=startSession(newData(),day);d=tick(d,2);const saved=migrateData(d,day);expect(saved.active!.bonus!.blocked).toBe(true);expect(first(100,'completed',saved).active!.bonus!.generated).toBe(false);
 expect(endSession(d).active!.finished).toBe(true);expect(endSession(d).active!.bonus!.generated).toBe(false);
 d=pause(d,true);expect(tick(d,900).active!.elapsed).toBe(d.active!.elapsed);
});
it('第二组只生成一次、转换和休息不计时、第二组完成直接总结',()=>{
 let d=first(100);const frozen=structuredClone(d.active!.prepared);expect(finishRound(d,'completed')).toEqual(d);
 const before=d.active!.elapsed;d=tick(d,5);expect(d.active!.elapsed).toBe(before);expect(trainingGroup(d.active!)).toBe(2);
 while(!d.active!.finished){d=finishRound(d,'completed');if(!d.active!.finished)d=nextRound(d)}
 expect(d.active!.prepared).toEqual(frozen);expect(d.results.length).toBe(d.active!.plan.length);expect(d.results.filter(r=>r.group===1)).toHaveLength(d.active!.bonus!.firstCount);expect(d.results.some(r=>r.group===2)).toBe(true);
 expect(startSession(d,day).results).toEqual(d.results);expect(finishRound(d,'completed')).toEqual(d);
});
it('含自由练习预算不足不加练；剩余少量时缩减组数且绝不超过600秒',()=>{
 for(const spent of [500,450]){let d=newData();for(let n=0;n<8;n++){d=startSession(d,day,'sudoku');d=tick(d,spent/8);d=endSession(d)}
 d=startSession(d,day);d=first(90,'completed',d);
 expect(d.active!.bonus!.generated).toBe(spent===450);
 if(spent===450){expect(d.active!.plan.length-d.active!.bonus!.firstCount).toBe(2);d=nextRound(d);while(!d.active!.finished){d=tick(d,99999);if(!d.active!.finished)d=nextRound(d)}d=startSession(d,day,'sudoku');d=tick(d,99999);expect(dailyUsed(d,day)).toBeCloseTo(600)}
 expect(dailyUsed(d,day)).toBeLessThanOrEqual(600);
 }
});
it('第二组跨日结束，新一天只生成第一组',()=>{let d=nextRound(first(99));const tomorrow=new Date(day+'T12:00:00');tomorrow.setDate(tomorrow.getDate()+1);const next=localDay(tomorrow);d=rollover(d,next);expect(d.active!.finished).toBe(true);const old=structuredClone(d.plans![day]);d=startSession(d,next);expect(d.active!.bonus!.generated).toBe(false);expect(d.plans![day]).toEqual(old)});
it('存储、刷新、离线数据恢复与备份重复导入不重新生成或计分',async()=>{
 const d=nextRound(first(100));await writeData(d);const loaded=await readData();expect(loaded.active!.paused).toBe(true);expect(loaded.active!.prepared).toEqual(d.active!.prepared);expect(loaded.results).toEqual(d.results);
 const backup=parseBackup(JSON.stringify(exportBackup(loaded)));const restored=mergeBackup(newData(),backup);expect(restored.active!.bonus).toEqual(d.active!.bonus);expect(mergeBackup(restored,backup).results).toEqual(d.results);expect(startSession(restored,day).active!.prepared).toEqual(d.active!.prepared);
});
it('旧版无加练字段继续正常读取，不追溯生成第二组',()=>{const d=startSession(newData(),day);delete d.active!.bonus;delete d.plans![day].bonus;expect(migrateData(d,day).active!.round).toEqual(d.active!.round);expect(parseBackup(JSON.stringify(exportBackup(d))).active!.bonus).toBeUndefined()});
it('30个种子的第二组优先未用类型、题目去重、可解且沿用独立等级',()=>{
 for(let i=0;i<30;i++){const data=newData();data.profileId=`bonus-${i}`;data.difficulties.sudoku.level=6;const d=first(99,'completed',startSession(data,day)),s=d.active!,cut=s.bonus!.firstCount;
 const signatures=s.prepared!.map(r=>questionSignature(r.state));expect(new Set(signatures).size).toBe(signatures.length);
 const firstIds=s.plan.slice(0,cut),second=s.plan.slice(cut);const unused=11-new Set(firstIds).size;expect(second.slice(0,Math.min(unused,second.length)).every(id=>!firstIds.includes(id))).toBe(true);
 for(const r of s.prepared!.slice(cut)){expect(validState(r.state)).toBe(true);expect(r.level).toBe(d.difficulties[r.game].level)}
 }
});
