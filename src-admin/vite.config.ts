import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
        build: {
            outDir: 'build',
        },
        plugins: [react()],
        base: './',
        server: {
            port: 3000,
            proxy: {
                '/adapter': {
                    target: 'http://localhost:8081',
                    changeOrigin: true,
                    secure: false,
                    configure: (proxy, _options): void => {
                        proxy.on('error', err => {
                            console.log('proxy error', err);
                        });
                        proxy.on('proxyReq', (_proxyReq, req) => {
                            console.log('Sending Request to the Target:', req.method, req.url);
                        });
                        proxy.on('proxyRes', (proxyRes, req) => {
                            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
                        });
                    },
                },
            },
        },
    };
});
