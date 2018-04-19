var express = require('express');
var app = express();
app.get('/', function(req, res) {
  res.send('Hello Seattle\n');
});
var port = process.env.PORT || 1337;
app.listen(port);

console.log("Server running at http://localhost:%d", port);
