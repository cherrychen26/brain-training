import {test,expect,type Page} from '@playwright/test';
import type {AppData} from '../../src/domain/types';
import {mazeRoute,availableLink} from '../../src/games/visual';
async function read(page:Page):Promise<AppData>{return page.evaluate(()=>new Promise(resolve=>{const q=indexedDB.open('daily-brain-gym');q.onsuccess=()=>{const db=q.result,r=db.transaction('state').objectStore('state').get('main');r.onsuccess=()=>{db.close();resolve(r.result)}}}))}
for(const [id,name] of [['differences','找不同'],['maze','迷宫'],['links','连连看']])test(`${name}手机实际完成、资格默认保持、刷新和挑战`,async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('./');await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'确认并开始训练'}).click();
 let s=(await read(page)).active!.round!.state;
 if(s.kind==='differences')for(const i of s.differences)await page.getByRole('button',{name:`左图位置${i+1}`,exact:true}).click();
 if(s.kind==='maze')for(const i of mazeRoute(s).slice(1))await page.getByRole('button',{name:`迷宫位置${i+1}`,exact:true}).click();
 if(s.kind==='links')for(let k=0;k<8;k++){s=(await read(page)).active!.round!.state;if(s.kind!=='links')throw Error();for(const i of availableLink(s.cells,s.width)!)await page.getByRole('button',{name:`连连看位置${i+1}`,exact:true}).click()}
 await expect(page.getByRole('heading',{name:'把掌声送给自己'})).toBeVisible();await page.getByRole('button',{name:'回到首页',exact:true}).click();await page.getByRole('button',{name,exact:true}).click();await expect(page.getByRole('heading',{name:'上次训练成绩'})).toBeVisible();await expect(page.getByRole('radio').first()).toBeChecked();await page.getByRole('radio').nth(1).check();await page.reload();await expect(page.getByRole('radio').first()).toBeChecked();await page.getByRole('radio').nth(1).check();await page.getByRole('button',{name:'确认并开始训练'}).click();await expect.poll(async()=>(await read(page)).active!.round!.level).toBe(2);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
