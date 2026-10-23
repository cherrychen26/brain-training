import {gameIds,type AppData,type GameId,type Round,type Result,type Outcome,type Session} from './types';
import {CONFIG} from './config';
import {random,seedOf,localDay} from './random';
import {dailyPlan,bonusPlan} from './planner';
import {makeGame,act,gameDone,type Action} from '../games/engine';
import {questionSignature} from '../games/signature';
import {advanceTimed,explanation} from '../games/additional';
import {adjust,score,personalTarget,targetTime} from './adaptive';
export const newData=():AppData=>({schemaVersion:2,profileId:crypto.randomUUID(),plans:{},settings:{largeText:false,highContrast:false,sessionMinutes:8},difficulties:Object.fromEntries(gameIds.map(id=>[id,{level:1,lastChangeCount:0}])) as AppData['difficulties'],results:[],active:null});
export function makeRound(id:GameId,level:number,seed:string,limit:number):Round{return {game:id,level,ready:false,elapsed:0,limit:Math.min(limit,targetTime(id,level)),attempts:0,correct:0,hints:0,state:makeGame(id,level,random(seedOf(seed))),message:''}}
function sync(data:AppData){if(data.active?.mode==='daily'){data.plans??={};data.plans[data.active.day]=structuredClone(data.active)}return data}
export function dailyUsed(data:AppData,day:string){const recorded=data.results.filter(r=>r.day===day).reduce((n,r)=>n+r.duration,0),s=data.active;return recorded+(s&&s.day===day&&s.round?s.round.elapsed:0)}
export function ensureDailyPlan(data:AppData,day=localDay()):AppData{
 if(data.plans?.[day])return data;const n=structuredClone(data);n.plans??={};n.profileId??=crypto.randomUUID();const seed=`${n.profileId}:${day}:v${CONFIG.planVersion}`,plan=dailyPlan(day,n.profileId);
 const limit=Math.min(CONFIG.dailySeconds,n.settings.sessionMinutes*60),per=limit/Math.max(1,plan.length);const previous=Object.values(n.plans).filter(s=>s.day<day).sort((a,b)=>b.day.localeCompare(a.day)).slice(0,14);const used=new Set(previous.flatMap(s=>(s.prepared??[]).map(r=>questionSignature(r.state))));
 const prepared=plan.map((id,i)=>{let r=makeRound(id,n.difficulties[id].level,`${seed}:${i}:${id}`,per);for(let attempt=1;attempt<=12&&used.has(questionSignature(r.state));attempt++)r=makeRound(id,n.difficulties[id].level,`${seed}:${i}:${id}:variation:${attempt}`,per);return r});
 n.plans[day]={id:`daily:${n.profileId}:${day}`,day,startedAt:'',plan,index:0,elapsed:0,limit,paused:true,round:null,results:[],finished:!plan.length,mode:'daily',version:CONFIG.planVersion,seed,prepared,replacements:[],transition:0,bonus:{firstCount:plan.length,generated:false,blocked:false}};return n;
}
export function startSession(data:AppData,day=localDay(),only?:GameId):AppData{
 data=rollover(data,day);if(data.active&&!data.active.finished)return data;
 let n=ensureDailyPlan(data,day);n=structuredClone(n);
 if(!only){const existing=n.plans![day];n.active=structuredClone(existing);if(existing.finished)return n;if(!n.active.round){n.active.round=structuredClone(n.active.prepared![n.active.index]);n.active.startedAt||=new Date().toISOString()}n.active.paused=false;}
 else{const remaining=Math.max(0,CONFIG.dailySeconds-dailyUsed(n,day));if(remaining<=0){n.active={...structuredClone(n.plans![day]),round:null,finished:true,endReason:'今日训练已达到 10 分钟，明天再来。'};return n}const id=crypto.randomUUID(),limit=Math.min(CONFIG.practiceSeconds,remaining);n.active={id,day,startedAt:new Date().toISOString(),plan:[only],index:0,elapsed:0,limit,paused:false,round:makeRound(only,n.difficulties[only].level,id,limit),results:[],finished:false,mode:'practice',version:2};}
 if(dailyUsed(n,day)>=CONFIG.dailySeconds){n.active!.finished=true;n.active!.round=null;n.active!.endReason='今日已达到训练上限。'}prepareEntry(n);return sync(n);
}
export function replacePlannedGame(data:AppData,day:string,index:number,replacement:GameId):AppData{
 const original=data.plans?.[day];if(!original||original.finished||!gameIds.includes(replacement)||original.plan.includes(replacement)||!original.prepared?.[index]||original.replacements?.includes(index))return data;
 if(original.startedAt&&(index<original.index||(index===original.index&&(original.round?.elapsed||original.round?.attempts||original.round?.hints||!original.round))))return data;
 const n=structuredClone(data),s=n.plans![day];s.plan[index]=replacement;s.prepared![index]=makeRound(replacement,n.difficulties[replacement].level,`${s.seed}:replace:${index}:${replacement}`,s.prepared![index].limit);s.replacements??=[];s.replacements.push(index);
 if(s.round&&index===s.index)s.round=structuredClone(s.prepared![index]);if(n.active?.id===s.id)n.active=structuredClone(s);return n;
}
export function finishRound(data:AppData,outcome:Outcome):AppData{
 if(!data.active?.round||data.active.finished)return data;const n=structuredClone(data),s=n.active!,r=s.round!;const id=`${s.id}:${s.index}`;
 if(n.results.some(x=>x.id===id)){s.round=null;s.finished=true;s.paused=true;return sync(n)}
 const fast=outcome==='completed'&&r.elapsed<r.limit*.5&&r.level<10;
 const result:Result={prescribed:r.limit,fast,...(s.mode==='daily'?{group:trainingGroup(s)}:{}),id,sessionId:s.id,game:r.game,level:r.level,date:new Date().toISOString(),day:s.day,duration:r.elapsed,target:targetTime(r.game,r.level),correct:r.correct,attempts:r.attempts,hints:r.hints,outcome,before:n.difficulties[r.game].level,after:n.difficulties[r.game].level,errors:r.attempts-r.correct,personalTarget:personalTarget(n.results,r.game,r.level),rated:s.mode!=='practice',mode:s.mode??'legacy',explanation:explanation(r.state)};
 result.rating=Math.round(score(result)*100);result.scoringVersion=2;n.results.push(result);result.adjustment=result.rated&&!r.manualLevel&&!fast?adjust(n,r.game):'自由练习不重复计入难度与能力趋势';if(r.manualLevel)result.adjustment='本次按你确认的级别训练，不自动覆盖选择';else if(fast)result.adjustment='快速完成，下次由你选择保持或挑战高一级';if(fast)n.difficulties[r.game].offer={level:r.level,duration:r.elapsed,limit:r.limit};result.after=n.difficulties[r.game].level;s.results.push(result);s.review=structuredClone(r);s.round=null;s.transition=CONFIG.transitionSeconds;s.paused=false;
 if(outcome!=='completed'&&s.bonus)s.bonus.blocked=true;
 if(outcome==='completed')appendBonus(n);
 if(outcome==='ended'||s.index===s.plan.length-1||s.elapsed>=s.limit||dailyUsed(n,s.day)>=CONFIG.dailySeconds){s.finished=true;s.paused=true}return sync(n);
}
export function nextRound(data:AppData):AppData{if(!data.active||data.active.round||data.active.finished)return data;const n=structuredClone(data),s=n.active!;s.index++;const id=s.plan[s.index];if(!id){s.finished=true;return sync(n)}const remaining=Math.max(0,CONFIG.dailySeconds-dailyUsed(n,s.day));if(!remaining){s.finished=true;s.endReason='今日已达到 10 分钟。';return sync(n)}s.round=s.prepared?.[s.index]?structuredClone(s.prepared[s.index]):makeRound(id,n.difficulties[id].level,s.id+id,Math.min(150,s.limit-s.elapsed));s.round.limit=Math.min(s.round.limit,s.limit-s.elapsed,remaining);s.paused=false;s.transition=0;prepareEntry(n);return sync(n)}
export function endSession(data:AppData):AppData{if(data.active?.round)return finishRound(data,'ended');const n=structuredClone(data);if(n.active){n.active.finished=true;n.active.paused=true}return sync(n)}
export function rollover(data:AppData,day:string):AppData{if(!data.active||data.active.day===day||data.active.finished)return data;const n=endSession(data);if(n.active)n.active.endReason='日期已切换，昨天未完成的训练已保存。';return sync(n)}
export function tick(data:AppData,seconds:number,day=data.active?.day??localDay()):AppData{
 const moved=rollover(data,day);if(moved!==data)return moved;const s=data.active;if(!s||s.finished||s.paused||!Number.isFinite(seconds)||seconds<=0)return data;
 const n=structuredClone(data),a=n.active!;
 if(a.round?.ready===false)return data;
 if(!a.round){a.transition=Math.max(0,(a.transition??CONFIG.transitionSeconds)-seconds);return a.transition<=0?nextRound(n):sync(n)}
 const r=a.round,remaining=Math.max(0,CONFIG.dailySeconds-dailyUsed(n,day));const naturalRemaining=r.state.kind==='reaction'?Math.max(0,r.state.stimuli.length*(r.state.interval+r.state.gap)-r.elapsed):Infinity;const delta=Math.max(0,Math.min(seconds,a.limit-a.elapsed,r.limit-r.elapsed,remaining,naturalRemaining));a.elapsed+=delta;r.elapsed+=delta;advanceTimed(r);
 if(gameDone(r.state)&&(r.state.kind==='reaction'))return finishRound(n,'completed');
 if(a.elapsed>=a.limit||r.elapsed>=r.limit||dailyUsed(n,day)>=CONFIG.dailySeconds)return finishRound(n,'timeout');return sync(n);
}
export function play(data:AppData,action:Action):AppData{if(!data.active?.round||data.active.paused||data.active.finished||data.active.round.ready===false)return data;const n=structuredClone(data);n.active!.round=act(n.active!.round!,action);const r=n.active!.round!;if(gameDone(r.state)&&(r.state.kind!=='twentyfour'||action.type==='submit'))return finishRound(n,'completed');return sync(n)}
export function pause(data:AppData,value:boolean):AppData{if(!data.active||data.active.finished||data.active.paused===value)return data;const n=structuredClone(data);n.active!.paused=value;return sync(n)}

export function trainingGroup(s:Session):1|2{return s.bonus?.generated&&s.index>=s.bonus.firstCount?2:1}
/** Called only in the atomic completion update; loading a plan never generates questions. */
function appendBonus(data:AppData){
 const s=data.active!,b=s.bonus;
 if(s.mode!=='daily'||!b||b.generated||b.blocked||s.index!==b.firstCount-1||s.results.length!==b.firstCount||!s.results.every(r=>r.outcome==='completed'))return;
 b.firstSeconds=s.results.reduce((sum,r)=>sum+r.duration,0);
 if(b.firstSeconds>=CONFIG.bonusThresholdSeconds)return;
 const remaining=Math.max(0,CONFIG.dailySeconds-dailyUsed(data,s.day));
 const budget=Math.min(s.limit-s.elapsed,remaining);
 const ids=bonusPlan(s.plan,s.seed+':group:2').slice(0,Math.floor(budget/CONFIG.bonusMinRoundSeconds));
 if(!ids.length)return;
 const used=new Set((s.prepared??[]).map(r=>questionSignature(r.state)));const prepared:Round[]=[];
 for(const id of ids){
  for(let attempt=0;attempt<32;attempt++){
   const r=makeRound(id,data.difficulties[id].level,s.seed+':group:2:'+id+':'+attempt,budget/ids.length);
   const signature=questionSignature(r.state);if(used.has(signature))continue;
   used.add(signature);prepared.push(r);break;
  }
 }
 if(!prepared.length)return;
 b.generated=true;s.plan.push(...prepared.map(r=>r.game));s.prepared!.push(...prepared);
}

function prepareEntry(data:AppData){const s=data.active,r=s?.round;if(!s||!r||r.ready!==false)return;const state=r.state;if(state.kind==='reaction'){const previous=[...data.results].reverse().find(x=>x.game==='reaction');const old=previous?.explanation?.match(/配色(\d)/);if(old&&Number(old[1])===state.palette)state.palette=(state.palette!+1)%4;}}
export function confirmRound(data:AppData,challenge=false):AppData{const n=structuredClone(data),s=n.active,r=s?.round;if(!s||!r||r.ready!==false||s.finished)return data;const d=n.difficulties[r.game],offer=d.offer;const base=offer?offer.level:r.level,level=offer&&challenge?Math.min(10,base+1):base;const limit=Math.min(r.limit,s.limit-s.elapsed,CONFIG.dailySeconds-dailyUsed(n,s.day));if(limit<=0)return endSession(n);if(level!==r.level)s.round=makeRound(r.game,level,s.id+':choice:'+s.index+':'+level,limit);const selected=s.round!;selected.limit=Math.min(limit,targetTime(r.game,level));selected.ready=true;selected.manualLevel=!!offer;if(offer){d.level=level;delete d.offer;}s.paused=false;return sync(n)}
