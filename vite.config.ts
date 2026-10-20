import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({ plugins: [react(), tailwindcss(), VitePWA({registerType:'prompt', includeAssets:['favicon.svg','icon-192.png','icon-512.png'], manifest:{name:'每日脑力健身房',short_name:'脑力健身房',description:'每天十分钟以内的中文脑力练习',lang:'zh-CN',start_url:'/',scope:'/',display:'standalone',background_color:'#f6f7f2',theme_color:'#24594a',icons:[{src:'/icon-192.png',sizes:'192x192',type:'image/png'},{src:'/icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}]},workbox:{globPatterns:['**/*.{js,css,html,svg,png,woff2}'],navigateFallback:'index.html',cleanupOutdatedCaches:false}})], build:{emptyOutDir:false} });
