import {shuffle} from '../domain/random';
import type {TwentyFourState} from '../domain/types';
type Fraction={n:number;d:number;e:string};
const gcd=(a:number,b:number):number=>b?gcd(b,a%b):Math.abs(a);
function frac(n:number,d:number,e:string):Fraction{const g=gcd(n,d)||1;return {n:n/g*(d<0?-1:1),d:Math.abs(d/g),e}}
function combine(a:Fraction,b:Fraction,op:string):Fraction|null{const e=`(${a.e}${op}${b.e})`;switch(op){case '+':return frac(a.n*b.d+b.n*a.d,a.d*b.d,e);case '-':return frac(a.n*b.d-b.n*a.d,a.d*b.d,e);case '*':return frac(a.n*b.n,a.d*b.d,e);case '/':return b.n?frac(a.n*b.d,a.d*b.n,e):null;default:return null}}
export function solve24(numbers:number[]):string|null{function solve(items:Fraction[]):string|null{if(items.length===1)return items[0].n===24*items[0].d?items[0].e:null;for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const rest=items.filter((_,k)=>k!==i&&k!==j);for(const [a,b,op] of [[items[i],items[j],'+'],[items[i],items[j],'-'],[items[j],items[i],'-'],[items[i],items[j],'*'],[items[i],items[j],'/'],[items[j],items[i],'/']] as [Fraction,Fraction,string][]){const c=combine(a,b,op);if(c){const s=solve([...rest,c]);if(s)return s}}}return null}return solve(numbers.map(n=>({n,d:1,e:String(n)})))}
// A small recursive-descent parser; never evaluate JavaScript or accept unary signs/concatenation.
export function check24(expression:string,numbers:number[]):{ok:boolean;message:string}{try{const s=expression.replace(/\s/g,'').replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');if(s.length>120||!s||/[^0-9+*/()\-]/.test(s))throw Error('请只输入数字、加减乘除和括号。');let pos=0;const used:number[]=[];function atom():Fraction{if(s[pos]==='('){pos++;const f=sum();if(s[pos++]!==')')throw Error('请检查括号是否成对。');return f}const match=/^\d+/.exec(s.slice(pos));if(!match)throw Error('请检查算式。');pos+=match[0].length;const n=Number(match[0]);if(match[0]!==String(n))throw Error('请按原样使用卡片上的数字。');used.push(n);return {n,d:1,e:match[0]}}function product():Fraction{let a=atom();while(s[pos]==='*'||s[pos]==='/'){const op=s[pos++],b=atom(),c=combine(a,b,op);if(!c)throw Error('除数不能为零。');a=c}return a}function sum():Fraction{let a=product();while(s[pos]==='+'||s[pos]==='-'){const op=s[pos++];a=combine(a,product(),op)!}return a}const result=sum();if(pos!==s.length)throw Error('请在数字之间添加运算符。');if(used.sort((a,b)=>a-b).join(',')!==[...numbers].sort((a,b)=>a-b).join(','))throw Error('四个数字都要使用，并且每个只用一次。');return result.n===24*result.d?{ok:true,message:'正好是 24，做得好！'}:{ok:false,message:'结果还不是 24，再试一种组合。'}}catch(e){return {ok:false,message:e instanceof Error?e.message:'请检查算式。'}}}

const cache=new Map<string,{solution:string|null;cost:number}>();
export function analyze24(numbers:number[]){
 const key=[...numbers].sort((a,b)=>a-b).join(',');const existing=cache.get(key);if(existing)return existing;
 type Item=Fraction&{cost:number};let best=Infinity,solution:string|null=null;
 function visit(items:Item[]){if(items.reduce((n,x)=>n+x.cost,0)+items.length-1>=best)return;
 if(items.length===1){if(items[0].n===24*items[0].d){best=items[0].cost;solution=items[0].e}return}
 for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const rest=items.filter((_,k)=>k!==i&&k!==j);
 for(const [a,b,op] of [[items[i],items[j],'+'],[items[i],items[j],'-'],[items[j],items[i],'-'],[items[i],items[j],'*'],[items[i],items[j],'/'],[items[j],items[i],'/']] as [Item,Item,string][]){const c=combine(a,b,op);if(c)visit([...rest,{...c,cost:a.cost+b.cost+(op==='*'?2:op==='/'?3:1)+(c.d!==1?3:0)+(c.n<0?1:0)}])}}}
 visit(numbers.map(n=>({n,d:1,e:String(n),cost:0})));const result={solution,cost:best};cache.set(key,result);return result;
}
export function generate24(level:number,rng:()=>number):TwentyFourState{
 const target=3+Math.floor((level-1)*.8),max=level<=3?6:level<=6?9:13;
 let chosen:{numbers:number[];solution:string;cost:number}|null=null;
 for(let attempt=0;attempt<36;attempt++){const numbers=Array.from({length:4},()=>1+Math.floor(rng()*max));const result=analyze24(numbers);if(!result.solution)continue;if(!chosen||Math.abs(result.cost-target)<Math.abs(chosen.cost-target))chosen={numbers,solution:result.solution,cost:result.cost};if(result.cost===target)break}
 if(!chosen){const numbers=[1,2,3,4];chosen={numbers,solution:'(1+2+3)*4',cost:4}}
 return {kind:'twentyfour',numbers:shuffle(chosen.numbers,rng),solution:chosen.solution,expression:'',revealed:false};
}
