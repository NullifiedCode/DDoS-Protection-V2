const fs = require('fs'),
      express = require('express'),
      app = express(),
      requestIp = require('request-ip'),
      path = require('path');



var request_data = [];
const seconds = 1000 * 3,
      infractionsMax = 3;

app.use(requestIp.mw());
app.use(function(req, res, next) {
    // Ignore the request entirely if they are inside the blacklist.
    if(fs.existsSync('./ddos-filtered.cache')){
        if(fs.readFileSync('./ddos-filtered.cache').toString().includes(req.clientIp)){
            return;
        }
    }

    var timePast = false;
    if(request_data === undefined){
        request_data = [];
    }
    if(request_data[req.clientIp] === undefined){
        request_data[req.clientIp] = {
            time: new Date().getTime(),
            infractions: 0
        }
        timePast = true;
    }else{
        timePast = (new Date().getTime() - request_data[req.clientIp].time < seconds) ? false : true;
    }   

    switch(timePast){
        case true:
            request_data[req.clientIp].time = new Date().getTime();
            if(request_data[req.clientIp].infractions > 0){
                var g = parseInt(request_data[req.clientIp].infractions);
                g = g - 1;
                request_data[req.clientIp].infractions = g;
            }
            console.log(`[${req.method}] ${req.clientIp} ${request_data[req.clientIp].infractions}`);
            next();
            break;
        case false:
            var g = parseInt(request_data[req.clientIp].infractions);
            g = g + 1;
            request_data[req.clientIp].infractions = g;
            if(request_data[req.clientIp].infractions > infractionsMax){
    
                if(!fs.existsSync('./ddos-filtered.cache')){
                    fs.writeFileSync('./ddos-filtered.cache', '', function(er) {
                        
                    })
                }
                if(!fs.readFileSync('./ddos-filtered.cache').toString().includes(req.clientIp))
                    fs.appendFileSync('./ddos-filtered.cache', req.clientIp+"\n",function(err) {
    
                    });
    
                console.log(`[${req.method}] ${req.clientIp} is now blacklisted. Exceeded infractions`);
                delete request_data[req.clientIp];
                return;
            }
            console.log(`[${req.method}] blocked from ${req.clientIp} ${request_data[req.clientIp].infractions}`);
            break;
    }
});
app.get('/', function(req, res) {
    res.sendFile('index.html', {root: path.join(__dirname)});
});

app.listen(80);