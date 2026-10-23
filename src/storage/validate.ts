import {mazeRoute} from '../games/visual';
import {gameIds,type GameState,type Session} from '../domain/types';
import {validSudoku,countSolutions} from '../games/sudoku';
import {check24} from '../games/twentyfour';
import {moveBox,wonBox} from '../games/sokoban';
export const obj=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const num=(v:unknown,min=0,max=100000)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const arr=(v:unknown,max=100)=>Array.isArray(v)&&v.length<=max;
const ints=(v:unknown,max=100,valueMax=100)=>arr(v,max)&&(v as unknown[]).every(x=>num(x,0,valueMax)&&Number.isInteger(x));
function basicState(v:unknown):v is GameState{
 if(!obj(v)||!gameIds.includes(v.kind as never))return false;
 switch(v.kind){
 case 'differences':return num(v.size,4,6)&&ints(v.left,36,7)&&ints(v.right,36,7)&&ints(v.differences,9,35)&&ints(v.found,9,35)&&(v.left as number[]).length===Number(v.size)**2&&(v.right as number[]).length===Number(v.size)**2;
 case 'maze':return num(v.size,7,15)&&ints(v.cells,225,1)&&(v.cells as number[]).length===Number(v.size)**2&&num(v.player,0,224)&&num(v.start,0,224)&&num(v.goal,0,224);
 case 'links':return num(v.width,4,6)&&ints(v.cells,48,12)&&(v.cells as number[]).length%Number(v.width)===0&&(v.selected===null||num(v.selected,0,(v.cells as number[]).length-1));
 case 'schulte':return num(v.size,3,5)&&ints(v.cells,25,25)&&(v.cells as number[]).length===Number(v.size)**2&&new Set(v.cells as number[]).size===(v.cells as number[]).length&&num(v.next,1,26);
 case 'sudoku':return [4,6].includes(Number(v.size))&&[v.cells,v.givens,v.solution].every(a=>ints(a,36,6)&&(a as number[]).length===Number(v.size)**2)&&(v.selected===null||num(v.selected,0,Number(v.size)**2-1));
 case 'twentyfour':return ints(v.numbers,4,13)&&(v.numbers as number[]).length===4&&typeof v.solution==='string'&&v.solution.length<=120&&typeof v.expression==='string'&&v.expression.length<=120;
 case 'memory':return ints(v.cards,16,7)&&ints(v.open,2,15)&&ints(v.matched,16,15)&&(v.previewUntil===undefined||num(v.previewUntil,0,600));
 case 'sokoban':{const validBoard=(b:unknown):boolean=>obj(b)&&num(b.width,4,10)&&num(b.height,4,10)&&ints(b.walls,100,99)&&ints(b.goals,5,99)&&ints(b.boxes,5,99)&&num(b.player,0,99);return validBoard(v)&&validBoard(v.initial)&&arr(v.undo,100000)&&(v.undo as unknown[]).every(b=>obj(b)&&num(b.player,0,99)&&ints(b.boxes,5,99))&&arr(v.solution,2000)&&(v.solution as unknown[]).every(d=>['up','down','left','right'].includes(String(d)))&&num(v.moves)}
 case 'numbers':return arr(v.sequences,3)&&(v.sequences as unknown[]).length===3&&(v.sequences as unknown[]).every(x=>typeof x==='string'&&/^\d{3,9}$/.test(x))&&num(v.index,0,2)&&['show','recall','feedback'].includes(String(v.phase))&&num(v.phaseUntil,0,600)&&num(v.exposure,1,20)&&typeof v.answer==='string'&&/^\d{0,9}$/.test(v.answer)&&typeof v.done==='boolean';
 case 'patterns':return arr(v.questions,4)&&(v.questions as unknown[]).length===4&&(v.questions as unknown[]).every(q=>obj(q)&&ints(q.values,5,10000)&&(q.values as number[]).length===5&&num(q.answer,0,10000)&&Array.isArray(q.choices)&&q.choices.length===4&&q.choices.every(x=>num(x,-10000,10000))&&q.choices.includes(q.answer)&&typeof q.rule==='string')&&num(v.index,0,3)&&typeof v.answered==='boolean'&&typeof v.done==='boolean';
 case 'reaction':return (v.palette===undefined||(Number.isInteger(v.palette)&&num(v.palette,0,3)))&&arr(v.stimuli,20)&&(v.stimuli as unknown[]).length>=12&&(v.stimuli as unknown[]).every(x=>typeof x==='boolean')&&num(v.index,0,(v.stimuli as unknown[]).length)&&num(v.interval,.5,5)&&num(v.gap,.1,3)&&num(v.deadline,0,600)&&['stimulus','gap'].includes(String(v.phase))&&typeof v.responded==='boolean'&&typeof v.done==='boolean'&&arr(v.responseTimes,20)&&(v.responseTimes as unknown[]).every(x=>num(x,0,10));
 }return false;
}
export function validState(v:unknown):v is GameState{
 if(!basicState(v))return false;const integer=(n:number,min:number,max:number)=>Number.isInteger(n)&&n>=min&&n<=max;
 switch(v.kind){
 case 'differences':return new Set(v.differences).size===v.differences.length&&v.left.every((n,i)=>(n!==v.right[i])===v.differences.includes(i))&&v.found.every(i=>v.differences.includes(i));
 case 'maze':return mazeRoute(v).length>0;
 case 'links':return [...new Set(v.cells)].every(n=>!n||v.cells.filter(x=>x===n).length%2===0);
 case 'schulte':return integer(v.size,3,5)&&v.cells.every(n=>integer(n,1,v.cells.length))&&integer(v.next,1,v.cells.length+1);
 case 'sudoku':return (v.size===4||v.size===6)&&validSudoku(v.solution,v.size)&&countSolutions(v.givens,v.size)===1&&v.givens.every((n,i)=>n===0||n===v.solution[i])&&v.cells.every((n,i)=>(n===0||n===v.solution[i])&&(!v.givens[i]||n===v.givens[i]))&&(v.selected===null||integer(v.selected,0,v.cells.length-1));
 case 'twentyfour':return v.numbers.every(n=>n>=1)&&check24(v.solution,v.numbers).ok&&typeof v.revealed==='boolean';
 case 'memory':return v.cards.length>=6&&v.cards.length%2===0&&[...new Set(v.cards)].every(n=>v.cards.filter(c=>c===n).length===2)&&[...v.open,...v.matched].every(i=>integer(i,0,v.cards.length-1))&&new Set(v.open).size===v.open.length&&new Set(v.matched).size===v.matched.length;
 case 'sokoban':{const b=v.initial;const validBoard=(board:typeof b)=>{const size=board.width*board.height;return integer(board.width,4,10)&&integer(board.height,4,10)&&[...board.walls,...board.boxes,...board.goals,board.player].every(i=>integer(i,0,size-1))&&new Set(board.boxes).size===board.boxes.length&&new Set(board.goals).size===board.goals.length&&board.boxes.length>0&&board.boxes.length===board.goals.length&&![...board.boxes,...board.goals,board.player].some(i=>board.walls.includes(i))&&!board.boxes.includes(board.player)};if(!validBoard(v)||!validBoard(b)||v.width!==b.width||v.height!==b.height||JSON.stringify(v.walls)!==JSON.stringify(b.walls)||JSON.stringify(v.goals)!==JSON.stringify(b.goals))return false;let step=b;for(const d of v.solution){const next=moveBox(step,d);if(!next)return false;step=next}return wonBox(step)}
 case 'numbers':return integer(v.index,0,2)&&typeof v.feedback==='string'&&v.feedback.length<=1000&&v.answer.length<=v.sequences[v.index].length;
 case 'patterns':return integer(v.index,0,3)&&typeof v.feedback==='string'&&v.feedback.length<=1000&&v.questions.every(q=>new Set(q.choices).size===4&&q.rule.length<=1000);
 case 'reaction':return integer(v.index,0,v.done?v.stimuli.length:v.stimuli.length-1)&&(!v.done||v.index===v.stimuli.length);
 }
}
export function validSession(v:unknown):v is Session{
 if(!obj(v)||typeof v.id!=='string'||v.id.length>100||typeof v.day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.day)||!arr(v.plan,30000)||!(v.plan as unknown[]).every(id=>gameIds.includes(id as never))||!num(v.index,0,30000)||!num(v.elapsed,0,1000000)||!num(v.limit,0,600)||typeof v.paused!=='boolean'||typeof v.finished!=='boolean'||!arr(v.results,30000))return false;
 if(!Number.isInteger(v.index)||((v.plan as unknown[]).length>0&&Number(v.index)>=(v.plan as unknown[]).length)||typeof v.startedAt!=='string'||(v.startedAt!==''&&Number.isNaN(Date.parse(v.startedAt)))||(v.mode!==undefined&&!['daily','practice','legacy'].includes(String(v.mode))))return false;
 if(v.version===2&&v.mode==='daily'&&v.prepared===undefined)return false;
 const round=(r:unknown)=>obj(r)&&(r.ready===undefined||typeof r.ready==='boolean')&&(r.manualLevel===undefined||typeof r.manualLevel==='boolean')&&gameIds.includes(r.game as never)&&num(r.level,1,10)&&Number.isInteger(r.level)&&num(r.elapsed,0,600)&&num(r.limit,0,600)&&Number(r.elapsed)<=Number(r.limit)&&num(r.attempts)&&Number.isInteger(r.attempts)&&num(r.correct,0,Number(r.attempts))&&Number.isInteger(r.correct)&&num(r.hints)&&Number.isInteger(r.hints)&&typeof r.message==='string'&&r.message.length<=10000&&validState(r.state)&&r.state.kind===r.game;
 if(v.round!==null&&!round(v.round))return false;
 if(v.prepared!==undefined&&(!arr(v.prepared,10)||!(v.prepared as unknown[]).every(round)||(v.prepared as unknown[]).length!==(v.plan as unknown[]).length))return false;
 if(v.replacements!==undefined&&!ints(v.replacements,10,9))return false;
 if(v.transition!==undefined&&!num(v.transition,0,10))return false;
 if(v.bonus!==undefined){const b=v.bonus;if(!obj(b)||!Number.isInteger(b.firstCount)||!num(b.firstCount,1,5)||typeof b.generated!=='boolean'||typeof b.blocked!=='boolean'||(b.firstSeconds!==undefined&&!num(b.firstSeconds,0,600))||(b.generated?Number(b.firstCount)>=(v.plan as unknown[]).length:Number(b.firstCount)!==(v.plan as unknown[]).length))return false;}
 if(v.review!==undefined&&v.review!==null&&!round(v.review))return false;
 if(v.round!==null&&(v.round as {game:string}).game!==(v.plan as string[])[Number(v.index)])return false;
 if(v.prepared!==undefined&&!(v.prepared as {game:string}[]).every((r,i)=>r.game===(v.plan as string[])[i]))return false;
 return true;
}
