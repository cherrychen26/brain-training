import type {AppData,GameId,Result} from './types';
import {CONFIG} from './config';
export const eligible=(r:Result)=>r.rated!==false&&(r.outcome==='completed'||r.outcome==='timeout');
export function targetTime(id:GameId,level:number){return CONFIG.reference[id]+level*5}
const median=(values:number[])=>{const a=[...values].sort((a,b)=>a-b);return a.length%2?a[Math.floor(a.length/2)]:(a[a.length/2-1]+a[a.length/2])/2};
export function personalTarget(history:Result[],id:GameId,level:number){const reference=targetTime(id,level);const comparable=history.filter(r=>r.game===id&&r.level===level&&r.outcome==='completed'&&eligible(r)&&r.duration>0).slice(-10);return comparable.length>=3?Math.max(reference*.6,Math.min(reference*1.5,median(comparable.map(r=>r.duration)))):reference}
export function score(r:Result){if(r.scoringVersion===2&&r.rating!==undefined)return r.rating/100;const w=CONFIG.weights;const accuracy=r.attempts?r.correct/r.attempts:0;const speed=r.outcome==='completed'?Math.min(1,(r.personalTarget??r.target)/Math.max(1,r.duration)):0;return w.accuracy*accuracy+w.speed*speed+w.hints*Math.max(0,1-r.hints/3)+w.completion*(r.outcome==='completed'?1:0)}
export function adjust(data:AppData,id:GameId):string{
 const d=data.difficulties[id],p=CONFIG.adaptation;const records=data.results.filter(r=>r.game===id&&eligible(r));
 if(records.length<p.window)return '先积累 5 次正式训练，再评估难度';
 if(records.length-d.lastChangeCount<p.cooldown)return '调整后观察期，保持当前难度';
 const recent=records.slice(-p.window),accuracy=recent.reduce((n,r)=>n+(r.attempts?r.correct/r.attempts:0),0)/p.window;
 const completed=recent.filter(r=>r.outcome==='completed').length,mean=recent.reduce((n,r)=>n+score(r),0)/p.window;
 const fast=recent.filter(r=>r.outcome==='completed'&&r.duration<=(r.personalTarget??r.target)*p.speedUp).length;
 const hints=recent.reduce((n,r)=>n+r.hints,0)/p.window;
 const difficulty=(r:Result)=>r.outcome==='timeout'||(r.attempts>0&&r.correct/r.attempts<p.lowAccuracy);
 const streak=recent.slice(-p.difficultStreak).every(difficulty);
 let delta=0,reason='最近表现处于适度挑战范围，保持难度';
 if(accuracy>=p.minAccuracyUp&&completed>=p.minCompleted&&recent.slice(-2).every(r=>r.outcome==='completed')&&fast>=p.minCompleted&&hints<=p.maxMeanHints&&mean>=p.upScore){delta=1;reason='最近 5 次准确且较快，连续完成，温和提高 1 级'}
 else if((accuracy<p.lowAccuracy&&recent.filter(difficulty).length>=3)||(streak&&mean<p.lowScore)){delta=-1;reason='最近多次遇到困难，降低 1 级'}
 const level=Math.min(10,Math.max(1,d.level+delta));if(level!==d.level){d.level=level;d.lastChangeCount=records.length}return reason;
}
/** Compare only same game AND same level. No arbitrary level bonus or medical inference. */
export function comparableChange(recent:Result[],history:Result[]){const changes:number[]=[];for(const r of recent.filter(eligible)){const baseline=history.filter(h=>eligible(h)&&h.game===r.game&&h.level===r.level);if(baseline.length>=3)changes.push(score(r)-baseline.reduce((n,h)=>n+score(h),0)/baseline.length)}return {count:changes.length,points:changes.length?Math.round(changes.reduce((n,v)=>n+v,0)/changes.length*100):null}}
