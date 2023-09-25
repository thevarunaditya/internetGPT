const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { spawn } = require('child_process');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

io.on('connection', (socket) => {
  const pythonProcess = spawn('python3', ['script.py']);
  
  pythonProcess.stdout.on('data', (data) => {
    socket.emit('scriptOutput', data.toString());
  });
  
  pythonProcess.stderr.on('data', (data) => {
    socket.emit('scriptError', data.toString());
  });

  socket.on('sendInput', (data) => {
    pythonProcess.stdin.write(data.input + '\n');
  });
});

server.listen(3000, () => {
  console.log('Listening on port 3000');
});
