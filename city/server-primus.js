// server-primus.js
// This Server provides a REST API and supports Websockets for real-time control and status

// Dependencies
	var Primus = require('primus');
	var PrimusEmitter = require('primus-emitter');
	var express = require('express');
	var http = require('http');
	var path = require('path');

	// used for debugging purposes
	var util = require('util');
		//Example: console.log(util.inspect(configs, false, null));


//  Circuit communication
	var fork = require('child_process').fork;
	var circuit = fork(__dirname + '/circuit-master.js');	// Update circuit file as needed for each project

	circuit.send("Hello from server!");

	// Receive communication from circuit (pre-websocket)
	/*
	circuit.on('message', function(message) {
		console.log("message from circuit: ", message);
	});
	*/


//Setting the path to static assets
	var app = express();
	app.use(express.static(path.join(__dirname,"public")));
	//Serving the static HTML file
	app.get('/', function (res) {
	    res.sendFile('/index.html')
	});

// Define API
	// example: http://192.168.0.15:8080/command/crossing

	app.get('/command/:command', function(req,res){
	     var command = req.params.command;
	     console.log("received command from api: ");
	     // do something with command
	     circuit.send({'command': command});
	     res.send('ok');
	});

// Create server
	var server = http.createServer(app);



//  Add WebSockets support to http server
	var primus = new Primus(server, { transformer: 'websockets', parser: 'JSON' });
	primus.use('emitter', PrimusEmitter);
	primus.on('connection', function(spark){
		console.log("websocket client connected",spark.id);
			// Send to websocket client
			spark.send('news', 'Howdy! You are connected to the IoL');

	    // If WebSockets server receives a ‘command’ event, it will process it
	    spark.on("command", function(command){
	    	console.log("socket command: ", command);

		    // We have the command, send it to the circuit code
		    circuit.send({'command': command});
	     });

	    // If WebSockets server receives a 'data' event, it will process it
	    spark.on('data', function(data){
	    	console.log("socket data: ", data);
	    });

	    // Revieve data from circuit
		circuit.on('message', function(msg) {
			console.log("message from circuit: ", msg);
			spark.send('news', "Message from circuit coming in!");
			spark.send('news', msg.trafficSignalState);
			console.log("msg.trafficSignalState = ", msg.trafficSignalState);
			spark.send('rawData', msg);
		});

	});

// Turn on sever
	server.listen(8080);
