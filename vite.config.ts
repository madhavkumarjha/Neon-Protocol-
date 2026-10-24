import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    server: {
      port: 3000,
      open: false
    },
    plugins: [
      {
        name: 'api-generate-dev-middleware',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/generate' && req.method === 'POST') {
              if (env.GROQ_API_KEY && !process.env.GROQ_API_KEY) {
                process.env.GROQ_API_KEY = env.GROQ_API_KEY;
              }

              const chunks: Buffer[] = [];
              req.on('data', (chunk: Buffer) => chunks.push(chunk));
              req.on('end', async () => {
                try {
                  const rawBody = Buffer.concat(chunks).toString();
                  (req as any).body = rawBody ? JSON.parse(rawBody) : {};

                  const adaptedRes: any = res;
                  adaptedRes.status = (code: number) => {
                    res.statusCode = code;
                    return adaptedRes;
                  };
                  adaptedRes.json = (data: unknown) => {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                    return adaptedRes;
                  };

                  const handler = (await import('./api/generate')).default;
                  await handler(req as any, adaptedRes);
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: (err as Error).message }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    build: {
      target: 'es2022',
      outDir: 'dist',
      assetsInlineLimit: 0
    },
    // @ts-ignore - Vitest types
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/unit/**/*.test.ts']
    }
  };
});
