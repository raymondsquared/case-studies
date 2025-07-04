var grpc = require('@grpc/grpc-js');

var parseArgs = require('minimist');
var messages = require('./protobuf/helloworld_messages_pb');
var servicesGRPC = require('./protobuf/helloworld_services_grpc_pb');

function main() {
  var argv = parseArgs(process.argv.slice(2), {
    string: ['host', 'port'],
  });
  var target;
  var host;
  var port;
  if (argv.host) {
    host = argv.host;
  } else {
    host = 'localhost';
  }

  if (argv.port) {
    port = argv.port;
  } else {
    port = '50051';
  }

  serverURL = host + ':' + port;
  
  var client = new servicesGRPC.GreeterClient(
    serverURL,
    grpc.credentials.createInsecure(),
  );

  var request = new messages.HelloRequest();
  var user;
  if (argv._.length > 0) {
    user = argv._[0];
  } else {
    user = 'world';
  }
  request.setName(user);

  client.sayHello(request, function (err, response) {
    if (err) {
      console.error('Error:', err.message);
    } else {
      // console.log(response);
      console.log('Greeting:', response.getMessage());
    }
  });
}

main();
