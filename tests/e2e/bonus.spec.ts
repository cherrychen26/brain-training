import {test,expect} from '@playwright/test';
import {newData,startSession,makeRound,finishRound,nextRound,pause} from '../../src/domain/session';
import {localDay} from '../../src/domain/random';

test('手机首组实际判题后自动加练，离线刷新恢复第二组并归集总结',async({page,context})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('./');await expect(page.getByText('已存到本机',{exact:true})).toBeVisible();
 // Isolated test profile only; never writes to a user's browser profile.
 let data=startSession(newData(),localDay());const s=data.active!;
 s.plan=['sudoku','patterns','schulte'];s.prepared=s.plan.map((id,i)=>makeRound(id,1,`browser-bonus-${i}`,160));s.bonus={firstCount:3,generated:false,blocked:false};s.round=structuredClone(s.prepared[0]);
 for(let i=0;i<2;i++){data.active!.round!.elapsed=40;data.active!.elapsed+=40;data=nextRound(finishRound(data,'completed'))}
 data.active!.round!.ready=true;data=pause(data,true);
 await page.evaluate(value=>new Promise<void>((resolve,reject)=>{const request=indexedDB.open('daily-brain-gym');request.onsuccess=()=>{const db=request.result,tx=db.transaction('state','readwrite');tx.objectStore('state').put(value,'main');tx.oncomplete=()=>{db.close();resolve()};tx.onerror=()=>reject(tx.error)}}),data);
 await page.goto('./#/training');await page.reload();await page.getByRole('button',{name:'继续训练',exact:true}).click();
 for(let i=1;i<=9;i++)await page.getByRole('button',{name:`数字 ${i}`,exact:true}).click();
 await expect(page.getByText('已自动安排第2组',{exact:false})).toBeVisible();await page.getByRole('button',{name:'开始下一项',exact:true}).click();
 await expect(page.locator('.training-header')).toContainText('第2组');await page.getByRole('button',{name:'暂停',exact:true}).click();await expect(page.getByText('已存到本机',{exact:true})).toBeVisible();
 if(process.env.TEST_PRODUCTION){await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await context.setOffline(true)}
 await page.reload();await expect(page.locator('.training-header')).toContainText('第2组');await expect(page.getByRole('heading',{name:'休息一下，时间已暂停'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'提前结束训练'}).click();await page.getByRole('button',{name:'结束并保存'}).click();await expect(page.getByRole('heading',{name:'把掌声送给自己'})).toBeVisible();await expect(page.locator('.result-list')).toContainText('第1组');await expect(page.locator('.result-list')).toContainText('第2组');await page.reload();await expect(page.getByRole('heading',{name:'把掌声送给自己'})).toBeVisible();await context.setOffline(false);
});

test.beforeEach(async({page})=>{await page.addLocatorHandler(page.getByRole('button',{name:'确认并开始训练',exact:true}),async()=>{await page.getByRole('button',{name:'确认并开始训练',exact:true}).click()})});
