var parseArgs = require('minimist');
var messages = require('./protobuf/helloworld_messages_pb');
var services = require('./protobuf/helloworld_services_pb');
var servicesGRPC = require('./protobuf/helloworld_services_grpc_pb');

var grpc = require('@grpc/grpc-js');

function main() {
  var argv = parseArgs(process.argv.slice(2), {
    string: 'target',
  });
  var target;
  if (argv.target) {
    target = argv.target;
  } else {
    target = 'localhost:50051';
  }
  
  var client = new servicesGRPC.GreeterClient(
    target,
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
