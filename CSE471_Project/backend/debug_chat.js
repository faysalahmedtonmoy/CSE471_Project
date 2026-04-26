const http = require('http');

const data = JSON.stringify({
  receiverId: "654321654321654321654321", // Dummy ObjectId
  content: "Hi! I would like to chat with you."
});

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/message',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer test'
  }
}, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => console.log(res.statusCode, body));
});

req.on('error', error => console.error(error));
req.write(data);
req.end();
