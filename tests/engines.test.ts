import {confirmRound,startSession as rawStart,nextRound as rawNext} from '../src/domain/session';
import type {AppData as RunningData,GameId as RunningGame} from '../src/domain/types';
const startSession=(d:RunningData,day?:string,id?:RunningGame)=>confirmRound(rawStart(d,day,id));
const nextRound=(d:RunningData)=>confirmRound(rawNext(d));
import {describe,it,expect} from 'vitest';
import {random} from '../src/domain/random';
import {makeGame,act,gameDone} from '../src/games/engine';
import {generateSudoku,countSolutions,validSudoku} from '../src/games/sudoku';
import {generate24,check24,solve24} from '../src/games/twentyfour';
import {generateBox,moveBox,wonBox,solveBox} from '../src/games/sokoban';
import {newData,play,tick,pause,finishRound,endSession,dailyPlan,adjust,weekResults} from '../src/domain/training';
import {parseBackup,mergeBackup,exportBackup} from '../src/storage/backup';
import {gameIds,type Result,type Round,type SokobanBoard} from '../src/domain/types';
describe('题目可验证与可解',()=>{
 it('100 个不同种子的每级数独唯一解，4×4 与 6×6 都有效',()=>{for(let level=1;level<=10;level++)for(let seed=0;seed<100;seed++){const s=generateSudoku(level,random(seed));expect(countSolutions(s.givens,s.size)).toBe(1);expect(validSudoku(s.solution,s.size)).toBe(true);expect(s.givens.some(v=>v===0)).toBe(true)}});
 it('每级 24 点题目可解，支持分数中间结果',()=>{for(let level=1;level<=10;level++)for(let seed=0;seed<30;seed++){const s=generate24(level,random(seed));expect(check24(s.solution,s.numbers).ok).toBe(true)}expect(check24('8/(3-8/3)',[3,3,8,8]).ok).toBe(true);expect(solve24([1,1,1,1])).toBeNull()});
 it('24 点拒绝复用数字、拼接、代码、除零、隐式乘法和错误结果',()=>{for(const input of ['24','6*4+1-1','alert(1)','6/(4-4)','(1+2)(3+4)','1+2+3+4','01*2*3*4'])expect(check24(input,[1,2,3,4]).ok).toBe(false);expect(check24('(1+2+3)*4',[1,2,3,4]).ok).toBe(true)});
 it('每级推箱子都能沿生成证明路径到达目标',()=>{for(let level=1;level<=10;level++)for(let seed=0;seed<35;seed++){const s=generateBox(level,random(seed));expect(wonBox(s)).toBe(false);let b:SokobanBoard=s;for(const d of s.solution){const next=moveBox(b,d);expect(next).not.toBeNull();b=next!}expect(wonBox(b)).toBe(true)}});
 it('推箱子求解器找到可行路径，墙壁不可穿过',()=>{const s=generateBox(1,random(4));const solution=solveBox(s);expect(solution).not.toBeNull();let b:SokobanBoard=s;for(const d of solution!)b=moveBox(b,d)!;expect(wonBox(b)).toBe(true);expect(moveBox({...s,player:s.width+1},'left')).toBeNull()});
 it('方格没有重复、翻牌成对',()=>{for(let level=1;level<=10;level++){const s=makeGame('schulte',level,random(7));if(s.kind==='schulte')expect(new Set(s.cells).size).toBe(s.size*s.size);const m=makeGame('memory',level,random(7));if(m.kind==='memory')for(const v of new Set(m.cards))expect(m.cards.filter(x=>x===v)).toHaveLength(2)}});
});
describe('真实判题与交互',()=>{
 const round=(id:typeof gameIds[number]):Round=>({game:id,level:1,elapsed:0,limit:150,correct:0,attempts:0,hints:0,state:makeGame(id,1,random(42)),message:''});
 it('方格拒绝乱序，全部按序才完成',()=>{let r=round('schulte');if(r.state.kind!=='schulte')throw Error();r=act(r,{type:'cell',index:r.state.cells.indexOf(2)});expect(r.correct).toBe(0);for(let i=1;i<=9;i++){if(r.state.kind!=='schulte')throw Error();r=act(r,{type:'cell',index:r.state.cells.indexOf(i)})}expect(gameDone(r.state)).toBe(true);expect(r.attempts).toBe(10)});
 it('数独不允许修改题目，错误答案不被接受',()=>{let r=round('sudoku');if(r.state.kind!=='sudoku')throw Error();const fixed=r.state.givens.findIndex(Boolean),initial=r.state.selected,length=r.state.cells.length;r=act(r,{type:'cell',index:fixed});if(r.state.kind!=='sudoku')throw Error();expect(r.state.selected).toBe(initial);for(let i=0;i<length;i++){if(r.state.kind!=='sudoku')throw Error();if(r.state.givens[i])continue;const value=r.state.solution[i];r=act(r,{type:'cell',index:i});r=act(r,{type:'number',value})}expect(gameDone(r.state)).toBe(true)});
 it('翻牌必须亲自配对，提示不会自动得分',()=>{let r=round('memory');r=act(r,{type:'hidePreview'});r=act(r,{type:'hint'});expect(r.correct).toBe(0);r=act(r,{type:'closeCards'});if(r.state.kind!=='memory')throw Error();const cards=[...r.state.cards];for(const v of new Set(cards))for(let i=0;i<cards.length;i++)if(cards[i]===v)r=act(r,{type:'cell',index:i});expect(gameDone(r.state)).toBe(true)});
});
describe('训练与平滑难度',()=>{
 it('每日计划固定且包含 3–5 种不同游戏',()=>{for(let i=1;i<=31;i++){const p=dailyPlan(`2026-10-${String(i).padStart(2,'0')}`);expect([3,4,5]).toContain(p.length);expect(new Set(p).size).toBe(p.length);expect(p).toEqual(dailyPlan(`2026-10-${String(i).padStart(2,'0')}`))}});
 it('暂停不计时，不接受判题操作',()=>{let d=startSession(newData(),'2026-10-08','schulte');d=pause(d,true);expect(tick(d,50)).toEqual(d);expect(play(d,{type:'hint'})).toEqual(d)});
 it('每局超时自动记录，单次绝不超过十分钟',()=>{let d=newData();d.settings.sessionMinutes=10;d=startSession(d);while(!d.active!.finished){d=tick(d,10000);if(!d.active!.finished)d=nextRound(d)}expect(d.active!.elapsed).toBeLessThanOrEqual(600);expect(d.results.length).toBe(d.active!.plan.length);expect(d.results.every(r=>(r.outcome==='timeout'||r.game==='reaction'&&r.outcome==='completed')&&r.duration<=200)).toBe(true)});
 it('重复结束无重复记录，跳过与提前结束留痕',()=>{let d=startSession(newData());d=finishRound(d,'skipped');expect(finishRound(d,'skipped').results).toHaveLength(1);d=nextRound(d);d=endSession(d);expect(d.active!.finished).toBe(true);expect(d.results.map(r=>r.outcome)).toEqual(['skipped','ended'])});
 it('只升降一个级别，并有三次记录的冷却，五项独立',()=>{const d=newData();const result=(i:number):Result=>({id:String(i),sessionId:String(i),game:'schulte',level:1,date:new Date().toISOString(),day:'2026-10-08',duration:20,target:60,attempts:10,correct:10,hints:0,outcome:'completed',before:1,after:1});for(let i=0;i<5;i++){d.results.push(result(i));adjust(d,'schulte')}expect(d.difficulties.schulte.level).toBe(2);for(let i=5;i<7;i++){d.results.push(result(i));adjust(d,'schulte')}expect(d.difficulties.schulte.level).toBe(2);d.results.push(result(7));adjust(d,'schulte');expect(d.difficulties.schulte.level).toBe(3);expect(d.difficulties.sudoku.level).toBe(1);for(let i=8;i<13;i++){d.results.push({...result(i),correct:0,duration:150,hints:4,outcome:'timeout'});adjust(d,'schulte')}expect(d.difficulties.schulte.level).toBeLessThan(3)});
});
describe('安全备份',()=>{
 it('往返一致、幂等合并并保留现有记录',()=>{const a=finishRound(startSession(newData()),'skipped');const backup=parseBackup(JSON.stringify(exportBackup(a)));const b=mergeBackup(newData(),backup);expect(b.results).toEqual(a.results);expect(mergeBackup(b,backup).results).toHaveLength(1)});
 it('拒绝非法版本、非数字设置和畸形记录',()=>{const b=exportBackup(newData());expect(()=>parseBackup('{broken')).toThrow();expect(()=>parseBackup(JSON.stringify({...b,version:99}))).toThrow();expect(()=>parseBackup(JSON.stringify({...b,settings:{...b.settings,sessionMinutes:'8'}}))).toThrow();const d=finishRound(startSession(newData()),'skipped');const good=exportBackup(d);expect(()=>parseBackup(JSON.stringify({...good,results:[{...good.results[0],correct:-1}]}))).toThrow();expect(()=>parseBackup(JSON.stringify({...good,results:[{...good.results[0],day:'2026-02-31'}]}))).toThrow()});
 it('每周报告按本地自然周筛选',()=>{expect(weekResults([]).start.getDay()).toBe(1)})
});
