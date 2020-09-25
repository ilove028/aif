const Koa = require('koa');
const WebSocketServer = require('websocket').server;
const connectManager = require('./connect-manager');
const remote = require('./remote');

const COOKIE_NAME = 'session';
const PORT = 7001;
const app = new Koa();
const server = app.listen(PORT, () => {
  console.info(`Server listen ${PORT}`);
});
const wsServer = new WebSocketServer({
  httpServer: server,
  autoAcceptConnections: false
});
 
function originIsAllowed(origin) {
  return true;
}

wsServer.on('request', function(request) {
  if (!originIsAllowed(request.origin)) {
    // Make sure we only accept requests from an allowed origin
    request.reject();
    console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
    return;
  }
  
  let connection;
  let connectCookie = request.cookies.find(c => c.name === COOKIE_NAME);
  const connectId = connectCookie ? connectCookie.value : Math.random().toString(16).substr(2);
  if (connectId) {
    connection = request.accept();
  } else {
    connection = request.accept(null, null, [{ name: 'session', value: connectId, path: '/', httponly: true }]);
  }
  console.log((new Date()) + ' Connection accepted.');
  connection.on('message', function(message) {
      if (message.type === 'utf8') {
          const data = JSON.parse(message.utf8Data);
          remote.returnInvoke(data.id, data.result);
      }
      else if (message.type === 'binary') {
          console.log('Received Binary Message of ' + message.binaryData.length + ' bytes');
          connection.sendBytes(message.binaryData);
      }
  });
  connection.on('close', function(reasonCode, description) {
      console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
      connectManager.remove(connectId, connection);
  });

  connectManager.add(connectId, connection);

  //TODO Test
  remote.invoke(connectId, { path: 'math.add', parameters: [1, 3] }).then(console.log);
  remote.flush();
});