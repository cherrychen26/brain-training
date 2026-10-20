import type {Outcome,Result,Session} from './types';
import {localDay} from './random';
export * from './session';
export * from './adaptive';
export {dailyPlan} from './planner';
export const outcomeName:Record<Outcome,string>={completed:'已完成',skipped:'已跳过',ended:'提前结束',timeout:'时间到了'};
export function accuracy(results:Result[]){const attempts=results.reduce((n,r)=>n+r.attempts,0);return attempts?Math.round(results.reduce((n,r)=>n+r.correct,0)/attempts*100):null}
export function weekStart(date:Date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-(d.getDay()+6)%7);return d}
export function weekResults(results:Result[],offset=0){const start=weekStart(new Date());start.setDate(start.getDate()+offset*7);const end=new Date(start);end.setDate(end.getDate()+7);return {start,end,results:results.filter(r=>r.day>=localDay(start)&&r.day<localDay(end))}}
export function minutes(seconds:number){return Math.round(seconds/60*10)/10}
export function sessionProgress(s:Session){return Math.min(100,Math.round(s.elapsed/s.limit*100))}
