import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
 const pages = mode === 'github';
 const base = pages ? '/brain-training/' : '/';
 return {
  base,
  plugins: [react(), tailwindcss(), VitePWA({
   registerType:'prompt',
   scope:base,
   includeAssets:['favicon.svg','icon-192.png','icon-512.png'],
   manifest:{
    name:'每日脑力健身房',short_name:'脑力健身房',
    description:'每天十分钟以内的中文脑力练习',lang:'zh-CN',
    start_url:base,scope:base,display:'standalone',
    background_color:'#f6f7f2',theme_color:'#24594a',
    icons:[
     {src:`${base}icon-192.png`,sizes:'192x192',type:'image/png'},
     {src:`${base}icon-512.png`,sizes:'512x512',type:'image/png',purpose:'any maskable'}
    ]
   },
   workbox:{globPatterns:['**/*.{js,css,html,svg,png,woff2}'],navigateFallback:`${base}index.html`,cleanupOutdatedCaches:false}
  })],
  // Keep local builds and saved artifacts intact; CI starts from a fresh checkout.
  build:{outDir:pages?'dist-pages':'dist',emptyOutDir:false}
 };
});
