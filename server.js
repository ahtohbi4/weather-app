const server = require('http');
const nodeStatic = require('node-static');

const fileServer = new nodeStatic.Server('./src');

const DEFAULT_PORT = 3000;

server.createServer((request, response) => {
  request.addListener('end', () => {
    fileServer.serve(request, response);
  }).resume();
}).listen(DEFAULT_PORT, (error) => {
  if (error) {
    return console.log('Error: %s', error);
  }

  console.log(`Server is listening on ${DEFAULT_PORT}: http://localhost:${DEFAULT_PORT}`)
});
