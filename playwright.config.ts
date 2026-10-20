import {defineConfig} from '@playwright/test';
import path from 'node:path';
export default defineConfig({testDir:'tests/e2e',timeout:60000,workers:1,fullyParallel:false,reporter:'list',outputDir:path.resolve('../../work',`browser-tests-${Date.now()}`),use:{baseURL:process.env.TEST_BASE_URL||'http://127.0.0.1:5173',channel:'msedge',headless:true,viewport:{width:1440,height:1050},screenshot:'only-on-failure',trace:'retain-on-failure'}});
