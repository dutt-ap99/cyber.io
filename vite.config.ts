import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'pwned-middleware',
          configureServer(server) {
            server.middlewares.use('/api/pwned', (req, res) => {
              if (req.method !== 'POST') {
                res.statusCode = 405;
                res.end('Method Not Allowed');
                return;
              }

              let body = '';
              req.on('data', chunk => {
                body += chunk.toString();
              });

              req.on('end', () => {
                try {
                  const { account } = JSON.parse(body);
                  const apiKey = env.HIBP_API_KEY;

                  if (!apiKey) {
                    // Return mock data if no API key is provided
                    const mockData = [
                      {
                        Name: 'Canva',
                        Domain: 'canva.com',
                        BreachDate: '2019-05-24',
                        Description: 'In May 2019, Canva suffered a data breach...',
                        DataClasses: ['Email addresses', 'Passwords', 'Usernames'],
                      },
                      {
                        Name: 'LinkedIn',
                        Domain: 'linkedin.com',
                        BreachDate: '2012-05-05',
                        Description: 'In 2012, LinkedIn suffered a data breach...',
                        DataClasses: ['Email addresses', 'Passwords'],
                      }
                    ];
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(mockData));
                    return;
                  }

                  const options = {
                    hostname: 'haveibeenpwned.com',
                    port: 443,
                    path: `/api/v3/breachedaccount/${encodeURIComponent(account)}?truncateResponse=false`,
                    method: 'GET',
                    headers: {
                      'hibp-api-key': apiKey,
                      'user-agent': 'GhostProtocol-Privacy-Wiper'
                    }
                  };

                  const hibpReq = https.request(options, (hibpRes) => {
                    let hibpData = '';
                    hibpRes.on('data', (d) => { hibpData += d; });
                    hibpRes.on('end', () => {
                      if (hibpRes.statusCode === 404) {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify([])); // No breaches found
                      } else {
                        res.statusCode = hibpRes.statusCode || 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(hibpData);
                      }
                    });
                  });

                  hibpReq.on('error', (e) => {
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: e.message }));
                  });
                  hibpReq.end();
                } catch (e) {
                  res.statusCode = 400;
                  res.end('Bad Request');
                }
              });
            });
          }
        }
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
