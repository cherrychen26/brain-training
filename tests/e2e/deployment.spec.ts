import {test,expect} from '@playwright/test';

test('发布路径资源无404、无脚本异常，hash页面可直接进入并刷新',async({page,request,baseURL})=>{
 const base=new URL(baseURL??'http://127.0.0.1:5173/');
 const failures:string[]=[],errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)failures.push(`${response.status()} ${response.url()}`)});
 await page.goto(base.href);
 await expect(page.getByRole('heading',{name:'今天，也让大脑动一动'})).toBeVisible();
 const resources=await page.locator('script[src],link[href]').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('src')??node.getAttribute('href')!));
 for(const resource of resources){
  const url=new URL(resource,base);
  expect(url.pathname.startsWith(base.pathname)).toBe(true);
  expect((await request.get(url.href)).status()).toBe(200);
 }
 for(const [route,title] of [['reports','我的训练报告'],['history','训练历史'],['settings','偏好设置']]){
  const url=new URL(base);url.hash=`/${route}`;
  await page.goto(url.href);await page.reload();
  await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible();
 }
 if(process.env.TEST_PRODUCTION){
  const manifest=await (await request.get(new URL('manifest.webmanifest',base).href)).json();
  expect(manifest.start_url).toBe(base.pathname);expect(manifest.scope).toBe(base.pathname);
  for(const icon of manifest.icons){expect(new URL(icon.src,base).pathname.startsWith(base.pathname)).toBe(true)}
  await page.evaluate(async()=>{await navigator.serviceWorker.ready});
  const scope=await page.evaluate(async()=>(await navigator.serviceWorker.ready).scope);
  expect(new URL(scope).pathname).toBe(base.pathname);
 }
 expect(failures).toEqual([]);expect(errors).toEqual([]);
});

test.beforeEach(async({page})=>{await page.addLocatorHandler(page.getByRole('button',{name:'确认并开始训练',exact:true}),async()=>{await page.getByRole('button',{name:'确认并开始训练',exact:true}).click()})});
