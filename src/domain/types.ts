export const gameIds = ['schulte','sudoku','twentyfour','memory','sokoban','numbers','patterns','reaction'] as const;
export type GameId = typeof gameIds[number];
export const gameMeta:Record<GameId,{name:string;skill:string;description:string;color:number}> = {
 schulte:{name:'舒尔特方格',skill:'专注力',description:'按顺序寻找数字，练习专注与观察。',color:0},
 sudoku:{name:'数独',skill:'逻辑力',description:'填一填数字，让每一行都恰到好处。',color:2},
 twentyfour:{name:'24 点',skill:'计算力',description:'四个数字，加减乘除，巧妙得到 24。',color:3},
 memory:{name:'翻牌记忆',skill:'记忆力',description:'记住图案的位置，找到相同的一对。',color:1},
 sokoban:{name:'推箱子',skill:'规划力',description:'一步一步，把箱子送到目标位置。',color:4},
 numbers:{name:'数字记忆',skill:'记忆力',description:'看一组数字，稍后按顺序回忆。',color:1},
 patterns:{name:'规律推理',skill:'逻辑力',description:'观察数列的变化，找出下一个数字。',color:2},
 reaction:{name:'反应与注意力',skill:'专注力',description:'看到“按”再点击，看到“停”请等待。',color:0},
};
export type Outcome='completed'|'skipped'|'ended'|'timeout';
export interface Result {id:string;sessionId:string;game:GameId;level:number;date:string;day:string;duration:number;target:number;correct:number;attempts:number;hints:number;outcome:Outcome;before:number;after:number;errors?:number;rating?:number;scoringVersion?:number;personalTarget?:number;rated?:boolean;adjustment?:string;explanation?:string;mode?:'daily'|'practice'|'legacy'}
export interface Difficulty {level:number;lastChangeCount:number}
export interface Settings {largeText:boolean;highContrast:boolean;sessionMinutes:6|8|10}
export interface SchulteState {kind:'schulte';size:number;cells:number[];next:number;highlight:number|null}
export interface SudokuState {kind:'sudoku';size:4|6;solution:number[];givens:number[];cells:number[];selected:number|null}
export interface TwentyFourState {kind:'twentyfour';numbers:number[];solution:string;expression:string;revealed:boolean}
export interface MemoryState {kind:'memory';cards:number[];open:number[];matched:number[];previewUntil?:number}
export interface NumbersState {kind:'numbers';sequences:string[];index:number;phase:'show'|'recall'|'feedback';phaseUntil:number;exposure:number;answer:string;feedback:string;done:boolean}
export interface PatternQuestion {values:number[];answer:number;choices:number[];rule:string}
export interface PatternsState {kind:'patterns';questions:PatternQuestion[];index:number;feedback:string;answered:boolean;done:boolean}
export interface ReactionState {kind:'reaction';stimuli:boolean[];index:number;interval:number;gap:number;deadline:number;phase:'stimulus'|'gap';responded:boolean;responseTimes:number[];done:boolean}
export type Direction='up'|'down'|'left'|'right';
export interface SokobanBoard {width:number;height:number;walls:number[];goals:number[];boxes:number[];player:number}
export interface SokobanState extends SokobanBoard {kind:'sokoban';initial:SokobanBoard;undo:{player:number;boxes:number[]}[];moves:number;solution:Direction[];highlight:Direction|null;optimalSteps?:number}
export type GameState=SchulteState|SudokuState|TwentyFourState|MemoryState|SokobanState|NumbersState|PatternsState|ReactionState;
export interface Round {game:GameId;level:number;elapsed:number;limit:number;correct:number;attempts:number;hints:number;state:GameState;message:string}
export interface Session {id:string;day:string;startedAt:string;plan:GameId[];index:number;elapsed:number;limit:number;paused:boolean;round:Round|null;results:Result[];finished:boolean;mode?:'daily'|'practice'|'legacy';version?:number;seed?:string;prepared?:Round[];replacements?:number[];transition?:number;review?:Round|null;endReason?:string}
export interface AppData {schemaVersion:1|2;settings:Settings;difficulties:Record<GameId,Difficulty>;results:Result[];active:Session|null;profileId?:string;plans?:Record<string,Session>}
