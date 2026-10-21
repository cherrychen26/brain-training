import {gameIds,type AppData,type Result} from '../domain/types';
import {newData,ensureDailyPlan,pause,rollover} from '../domain/session';
import {localDay} from '../domain/random';
/** Preserve v1 histories, levels and in-progress boards; never regenerate a saved board. */
export function migrateData(raw:AppData,day=localDay()):AppData{
 if(raw.schemaVersion!==1&&raw.schemaVersion!==2)throw Error('不支持的存档版本');
 const n=structuredClone(raw),fresh=newData();n.profileId??=fresh.profileId;n.plans??={};
 for(const id of gameIds)n.difficulties[id]??={level:1,lastChangeCount:0};
 n.results=n.results.map((r:Result)=>({...r,errors:r.errors??r.attempts-r.correct,mode:r.mode??'legacy',rated:r.rated??true}));
 if(n.active&&!n.active.mode){n.active.mode='daily';n.active.version=1;n.active.seed=`legacy:${n.active.id}`;n.plans[n.active.day]=structuredClone(n.active)}
 // A previously completed same-day legacy session must not become a fresh scoring opportunity.
 for(const date of new Set(n.results.filter(r=>r.mode==='legacy').map(r=>r.day))){if(n.plans[date])continue;const rs=n.results.filter(r=>r.day===date);n.plans[date]={id:`legacy:${date}`,day:date,startedAt:rs[0].date,plan:rs.map(r=>r.game),index:Math.max(0,rs.length-1),elapsed:rs.reduce((a,r)=>a+r.duration,0),limit:600,paused:true,round:null,results:rs,finished:true,mode:'daily',version:1}}
 // A running first group restored after an unexpected exit remains resumable, but cannot earn an extra group.
 if(n.active&&!n.active.finished&&!n.active.paused&&n.active.bonus&&!n.active.bonus.generated){n.active.bonus.blocked=true;n.plans[n.active.day]=structuredClone(n.active)}
 n.schemaVersion=2;return ensureDailyPlan(pause(rollover(n,day),true),day);
}
