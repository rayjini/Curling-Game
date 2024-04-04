const server = require('http').createServer(handler)
const io = require('socket.io')(server) 
const fs = require('fs') 
const url = require('url');
const PORT = process.env.PORT || 3000 

const ROOT_DIR = 'html' 

const MIME_TYPES = {
  'css': 'text/css',
  'gif': 'image/gif',
  'htm': 'text/html',
  'html': 'text/html',
  'ico': 'image/x-icon',
  'jpeg': 'image/jpeg',
  'jpg': 'image/jpeg',
  'js': 'application/javascript',
  'json': 'application/json',
  'png': 'image/png',
  'svg': 'image/svg+xml',
  'txt': 'text/plain'
}

function get_mime(filename) {
  for (let ext in MIME_TYPES) {
    if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
      return MIME_TYPES[ext]
    }
  }
  return MIME_TYPES['txt']
}

server.listen(PORT) 

function handler(request, response) {
  
  let urlObj = url.parse(request.url, true, false)
  console.log('\n============================')
  console.log("PATHNAME: " + urlObj.pathname)
  console.log("REQUEST: " + ROOT_DIR + urlObj.pathname)
  console.log("METHOD: " + request.method)

  let filePath = ROOT_DIR + urlObj.pathname
  if (urlObj.pathname === '/') filePath = ROOT_DIR + '/index.html'

  fs.readFile(filePath, function(err, data) {
    if (err) {
      console.log('ERROR: ' + JSON.stringify(err))
      response.writeHead(404);
      response.end(JSON.stringify(err))
      return
    }
    response.writeHead(200, {
      'Content-Type': get_mime(filePath)
    })
    response.end(data)
  })

}
io.on('connection', function(socket) {
  console.log('client connected');

  const connectedUsers = {}; 

  
  socket.on('set username', function(username, callback) {
    if (username && !connectedUsers[username]) {
      socket.username = username;
      connectedUsers[username] = socket.id; 
      callback(true); 
      io.emit('serverSays', username + ' has joined the chat.');
    } else {
      callback(false);
    }
  });

  socket.on('clientSays', function(data) {
    
    if (socket.username) {
      console.log('RECEIVED from ' + socket.username + ': ' + data);
      io.emit('serverSays', `${socket.username}: ${data}`);
    } else {
      console.log('Message from an unregistered user ignored.');
    }
  });

  socket.on('disconnect', function() {
    console.log('client disconnected');
    if (socket.username && connectedUsers[socket.username]) {
      delete connectedUsers[socket.username];
      io.emit('serverSays', socket.username + ' has left the chat.');
    }
  });
});

console.log(`Server Running at port ${PORT}  CNTL-C to quit`)
console.log(`To Test:`)
console.log(`Open several browsers to: http://localhost:3000/curling.html`)
