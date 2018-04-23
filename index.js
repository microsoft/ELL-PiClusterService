var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var ECT = require('ect')
var ectRenderer = ECT({ watch: true, root: __dirname + '/views', ext : '.ect' });

var filename = "machines.json";
var jsonParser = bodyParser.json();
var apikey = "53D933D0-C44A-4ED1-946D-AFDDA4B9B84C";
var machineList = null;
var lastHeartbeat = [];

function validate_heartbeats()
{
    var now =  Date.now();
    for(var i in machineList)
    {
        var m = machineList[i];
        diff = now - m.LastHeartbeat;
        if (m.LastHeartbeat == "undefined" || diff > 5 * 60000){
            // haven't heard from this machine in 5 minutes!
            m.IsAlive = false;
            m.Comment = "dead?";
        } else {
            m.IsAlive = true;
            m.Comment = ""
        }
        m.Seconds = Math.round(diff/1000).toString();
    }
}

function getMachineList()
{
    if (machineList == null)
    {
        if (fs.existsSync(filename)){
            machineList = JSON.parse(fs.readFileSync(filename, 'utf8'));
        } else {
            machineList = []
        }
    }
    return machineList;
}

function saveMachineList(list)
{
    list.sort(function(a,b) { return a.IpAddress.localeCompare(b.IpAddress); })
    fs.writeFileSync(filename, JSON.stringify(list), 'utf8', 2);
}

function findMachine(list, id)
{
    for (var i in list){
        m = list[i]
        if (m.IpAddress === id){
            return m;
        }
    }
    return null;
}

var app = express();

app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);

app.get('/', function(req, res) {
    
    var list = getMachineList();
    validate_heartbeats();
    data = {
        title : 'PiManager',
        id : 'main',
        list: list
    }

    res.render('index', data);
});

app.get('/api', function(req, res) {
    var list = getMachineList();
    validate_heartbeats();
    var result = list;
    var id = req.query.id;
    if (id)
    {
        var m = findMachine(list, id);
        return res.json([m]);
    }
    res.json(list);
});

app.post('/api/update', jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(500);
    if (req.body.ApiKey === apikey)
    {
        var list = getMachineList();
        var m = findMachine(list, req.body.IpAddress);
        if (m == null) {
            m = req.body;
            m.LastHeartbeat = Date.now();
            delete m.ApiKey;
            list.push(m);
        } else {
            // merge what we are allowed to merge here
            // update is not allowed to change the current user or command info.
            m.Platform = req.body.Platform;
            m.OsName = req.body.OsName;
            m.OsVersion = req.body.OsVersion;
            m.LastHeartbeat = Date.now();
            m.Comment = req.body.Comment;
            m.IsAlive = true
        }
        validate_heartbeats();
        saveMachineList(list)
        res.json(m);
    } else {
        res.sendStatus(403) // forbidden
    }
});

app.post('/api/lock', jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(500);
    if (req.body.ApiKey === apikey)
    {
        var result = null;
        var list = getMachineList();
        var m = findMachine(list, req.body.IpAddress);
        if (m) 
        {
            if (m.CurrentUserName == "" || m.CurrentUserName == req.body.CurrentUserName || m.Command != "Lock")
            {
                m.Command = "Lock";
                m.CurrentUserName = req.body.CurrentUserName;
                m.CurrentTaskName = req.body.CurrentTaskName;
                m.LockKey = req.body.LockKey;
                saveMachineList(list);
                result = m;
            }
        }
        res.json(result);
    } else {
        res.sendStatus(403) // forbidden
    }
});

app.post('/api/free', jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(500)
    if (req.body.ApiKey === apikey)
    {
        var result = null;
        var list = getMachineList();
        var m = findMachine(list, req.body.IpAddress);
        if (m) 
        {
            if (m.CurrentUserName == "" || m.CurrentUserName == req.body.CurrentUserName)
            {
                m.Command = "Free";
                m.CurrentUserName = "";
                m.CurrentTaskName = "";
                m.LockKey = "";
                saveMachineList(list);
                result = m;
            }
        }
        res.json(result);
    } else {
        res.sendStatus(403) // forbidden
    }
});

app.post('/api/delete', jsonParser, function(req, res) {
    if (!req.body) return res.sendStatus(500);
    if (req.body.ApiKey === apikey)
    {
        var result = null;
        var list = getMachineList();
        var m = findMachine(list, req.body.IpAddress);
        if (m && m.Command != "Lock") 
        {
            list.splice(list.indexOf(m), 1);
            saveMachineList(list);
            result = m;
        }
        res.json(result);
    } else {
        res.sendStatus(403) // forbidden
    }
});


var port = process.env.PORT || 1337;
app.listen(port);

console.log("Server running at http://localhost:%d", port);
