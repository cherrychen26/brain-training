import {shuffle} from '../domain/random';
/** Local-only generators and independently testable rules for the three new games. */
export function differencePuzzle(level:number,rng:()=>number){
 const size=level<=3?4:level<=6?5:6,count=level<=3?3:level<=6?5:7+Math.floor((level-7)/2);
 const left=Array.from({length:size*size},()=>Math.floor(rng()*8));
 const differences=shuffle(left.map((_,i)=>i),rng).slice(0,count),right=[...left];
 for(const i of differences)right[i]=(right[i]+1+Math.floor(rng()*7))%8;
 return {size,left,right,differences,found:[] as number[]};
}
export function findDifference(s:ReturnType<typeof differencePuzzle>,index:number){if(!s.differences.includes(index)||s.found.includes(index))return false;s.found.push(index);return true}
export function mazePuzzle(level:number,rng:()=>number){
 const size=7+2*Math.floor((level-1)/2),cells=Array<number>(size*size).fill(1),start=size+1,goal=(size-2)*size+size-2,stack=[start];cells[start]=0;
 while(stack.length){const p=stack.at(-1)!,x=p%size,y=Math.floor(p/size);const options=shuffle([[0,-2],[2,0],[0,2],[-2,0]],rng).filter(([dx,dy])=>x+dx>0&&x+dx<size-1&&y+dy>0&&y+dy<size-1&&cells[p+dy*size+dx]===1);
 if(!options.length){stack.pop();continue}const [dx,dy]=options[0],next=p+dy*size+dx;cells[p+dy/2*size+dx/2]=0;cells[next]=0;stack.push(next)}
 return {size,cells,start,goal,player:start};
}
export function mazeRoute(s:ReturnType<typeof mazePuzzle>){const queue=[s.player],parents=new Map<number,number>([[s.player,-1]]);for(let n=0;n<queue.length;n++){const p=queue[n];if(p===s.goal){const route:number[]=[];for(let c=p;c!==-1;c=parents.get(c)!)route.unshift(c);return route}for(const q of [p-s.size,p+s.size,p-1,p+1])if(q>=0&&q<s.cells.length&&Math.abs(q%s.size-p%s.size)+Math.abs(Math.floor(q/s.size)-Math.floor(p/s.size))===1&&!s.cells[q]&&!parents.has(q)){parents.set(q,p);queue.push(q)}}return []}
/** Search the padded board, tracking direction and turns; outside paths are legal. */
export function linkPath(cells:number[],width:number,a:number,b:number):number[]|null{
 if(a===b||!cells[a]||cells[a]!==cells[b])return null;
 const height=cells.length/width,w=width+2,h=height+2;
 const padded=(i:number)=>(Math.floor(i/width)+1)*w+i%width+1,start=padded(a),end=padded(b);
 const occupied=new Set(cells.flatMap((v,i)=>v&&i!==a&&i!==b?[padded(i)]:[]));
 const queue=[{p:start,d:-1,t:0,path:[start]}],best=new Map<string,number>();
 for(let k=0;k<queue.length;k++){const item=queue[k];for(let d=0;d<4;d++){const [dx,dy]=[[1,0],[0,1],[-1,0],[0,-1]][d],x=item.p%w+dx,y=Math.floor(item.p/w)+dy,t=item.t+(item.d!==-1&&item.d!==d?1:0);if(x<0||x>=w||y<0||y>=h||t>2)continue;const p=y*w+x;if(occupied.has(p))continue;const path=[...item.path,p];if(p===end)return path;const key=p+':'+d;if((best.get(key)??3)<=t)continue;best.set(key,t);queue.push({p,d,t,path})}}
 return null;
}
export function availableLink(cells:number[],width:number){for(let a=0;a<cells.length;a++)for(let b=a+1;b<cells.length;b++)if(linkPath(cells,width,a,b))return [a,b];return null}
/** Bounded reshuffling; constructive fallback guarantees at least one legal pair. */
export function rescueLinks(cells:number[],width:number,rng:()=>number){const slots=cells.flatMap((v,i)=>v?[i]:[]),values=slots.map(i=>cells[i]);if(!slots.length)return cells;
 for(let attempt=0;attempt<24;attempt++){const shuffled=shuffle(values,rng);slots.forEach((p,i)=>cells[p]=shuffled[i]);if(availableLink(cells,width))return cells}
 // Consecutive occupied cells in the first occupied row have an empty straight segment.
 const a=slots[0],b=slots.find(p=>p!==a&&Math.floor(p/width)===Math.floor(a/width))??slots[1];
 if(b===undefined)return cells;
 const match=slots.find(p=>p!==a&&cells[p]===cells[a]);if(match===undefined)throw Error('配对数量不完整');
 [cells[b],cells[match]]=[cells[match],cells[b]];
 // If the first row has only one tile, a minimum-row tile in the next column connects around the top.
 if(!availableLink(cells,width)){const pairs=new Map<number,number[]>();for(const p of slots){const list=pairs.get(cells[p])??[];list.push(p);pairs.set(cells[p],list)}
 const visible=slots.filter(p=>!slots.some(q=>q%width===p%width&&q<p));if(visible.length>=2){const [x,y]=visible,other=slots.find(p=>p!==x&&cells[p]===cells[x])!;[cells[y],cells[other]]=[cells[other],cells[y]]}}
 return cells;
}
export function linkPuzzle(level:number,rng:()=>number){const width=level<=3?4:6,height=level<=3?4:level<=6?6:8,types=Math.min(12,3+level);const cells=shuffle(Array.from({length:width*height},(_,i)=>1+Math.floor(i/2)%types),rng);return {width,cells:rescueLinks(cells,width,rng),selected:null as number|null}}
