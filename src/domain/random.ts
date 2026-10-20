export function seedOf(text:string){let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export function random(seed:number){return ()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
export function shuffle<T>(a:readonly T[],rng:()=>number=Math.random):T[]{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b}
export function localDay(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
