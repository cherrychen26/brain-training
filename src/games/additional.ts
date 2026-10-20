import type {GameId,GameState,Round,NumbersState,PatternsState,PatternQuestion,ReactionState} from '../domain/types';
import {shuffle} from '../domain/random';
export function generateAdditional(id:GameId,level:number,rng:()=>number):NumbersState|PatternsState|ReactionState{
 const int=(min:number,max:number)=>min+Math.floor(rng()*(max-min+1));
 if(id==='numbers'){const length=3+Math.floor((level-1)*.7),exposure=Math.max(3,8-level*.4);return {kind:'numbers',sequences:Array.from({length:3},()=>Array.from({length},()=>int(0,9)).join('')),index:0,phase:'show',phaseUntil:exposure,exposure,answer:'',feedback:'',done:false}}
 if(id==='patterns'){const questions:PatternQuestion[]=Array.from({length:4},()=>{const start=int(1,12),a=int(1,2+level),b=int(1,3+level);let values:number[],rule:string;
 if(level<=3){values=Array.from({length:6},(_,i)=>start+i*a);rule=`每一步加 ${a}`}
 else if(level<=6){values=[start];for(let i=1;i<6;i++)values.push(values[i-1]+(i%2?a:b));rule=`交替加 ${a}、加 ${b}`}
 else{values=[start];for(let i=1;i<6;i++)values.push(values[i-1]+a+(i-1)*b);rule=`依次加 ${Array.from({length:5},(_,i)=>a+i*b).join('、')}，每次增量再加 ${b}`}
 const answer=values.pop()!,options=new Set([answer,answer+a,answer-a,answer+b+1]);let extra=1;while(options.size<4)options.add(answer+10+extra++);return {values,answer,choices:shuffle([...options].slice(0,4),rng),rule}});return {kind:'patterns',questions,index:0,feedback:'',answered:false,done:false}}
 const interval=3-level*.17,gap=.8+level*.03;return {kind:'reaction',stimuli:shuffle(Array.from({length:12+2*Math.floor(level/3)},(_,i)=>i%3!==0),rng),index:0,interval,gap,deadline:interval,phase:'stimulus',responded:false,responseTimes:[],done:false};
}
export function advanceTimed(r:Round):Round{const s=r.state;
 if(s.kind==='memory'&&s.previewUntil!==undefined&&r.elapsed>=s.previewUntil)s.previewUntil=undefined;
 if(s.kind==='numbers'&&s.phase==='show'&&r.elapsed>=s.phaseUntil)s.phase='recall';
 if(s.kind==='reaction'&&!s.done){while(r.elapsed+1e-8>=s.deadline&&!s.done){if(s.phase==='stimulus'){r.attempts++;if(s.stimuli[s.index]===s.responded)r.correct++;r.message=s.stimuli[s.index]===s.responded?'判断正确。':s.stimuli[s.index]?'刚才需要点击，下一次再试。':'刚才是“停”，请等待不点。';s.phase='gap';s.deadline+=s.gap}else{s.index++;if(s.index>=s.stimuli.length){s.done=true;break}s.phase='stimulus';s.responded=false;s.deadline+=s.interval}}}return r;
}
export function explanation(s:GameState):string{switch(s.kind){case 'schulte':return `按 1 到 ${s.cells.length} 逐个寻找，不需要猜测。`;case 'sudoku':return `正确终盘（每行分隔）：${Array.from({length:s.size},(_,i)=>s.solution.slice(i*s.size,(i+1)*s.size).join(' ')).join(' / ')}`;case 'twentyfour':return `${s.solution.replaceAll('*','×').replaceAll('/','÷')} = 24`;case 'memory':return `相同图案的位置：${[...new Set(s.cards)].map(v=>s.cards.map((n,i)=>n===v?i+1:0).filter(Boolean).join(' 和 ')).join('；')}`;case 'sokoban':return `从初始棋盘出发的一条可解路径：${s.solution.map(d=>({up:'↑',down:'↓',left:'←',right:'→'}[d])).join(' ')}。箱子进入非目标角落会卡住，可先撤销。`;case 'numbers':return `本组数字：${s.sequences.join(' / ')}`;case 'patterns':return s.questions.map(q=>`${q.values.join('、')} → ${q.answer}（${q.rule}）`).join('；');case 'reaction':return '“按”出现时点击一次；“停”出现时不点击。按错、漏按分别计为一次判断错误，不是速度越快越好。'}}
