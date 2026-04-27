fetch('http://localhost:3001/api/resolve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://tumblr.com/privacy' })
}).then(r => r.json()).then(console.log).catch(console.error);
