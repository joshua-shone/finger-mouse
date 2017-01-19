var express = require('express');
var http    = require('http');
var yargs   = require('yargs');

var app = express();
var server = http.Server(app);

app.use(express.static('.'));
app.use(express.static('./bower_components/'));

var port = yargs.argv['port'] || 8080;

server.listen(port, function() {
  console.log('Demo running on port ' + port);
});
