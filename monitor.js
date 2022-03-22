const http = require('http');
const https = require('https');
const Report = require('./api/models/Report');
const Alerts = require('./alerts');

const updateReport = async (check,working,statusCode,method,responseTime) => {
    const report = await Report.findOne({owner_email: check.owner_email, name: check.name}).exec();
    report.status = statusCode;
    report.count++;
    if(working)
    {
        report.uptime += check.interval/1000;
    }
    else
    {
        report.consecutive_outages++;
        report.outages++;
        report.downtime += check.interval/1000;
        if(report.consecutive_outages===check.threshold)
        {
            report.consecutive_outages = 0;
            // ADD ALERT FUNCTIONS HERE (needed information is inside the 'check' document)
            Alerts.sendEmail({
                from: `Uptime Monitor <${process.env.EMAIL}>`,
                to: check.owner_email,
                subject: 'Uptime Monitor Notification',
                text: "The following check has failed "+check.threshold+" times. Check the logs.\n"
                + "Name of check: "+check.name+"\nUrl: "+check.url,
                html: "<h1>The following check has failed "+check.threshold+" times. Check the logs.</h1>"
                + "<p>Name of check: "+check.name+"</p><p>Url: "+check.url+"</p>"});
            if(check.webhook)
                Alerts.consumeWebHook(check.webhook,check);
        }
    }
    report.availability = (1-(report.outages/report.count))*100;
    report.responseTime = (responseTime+(report.count-1)*report.responseTime)/report.count;
    report.history.push( [method , check.url , statusCode , new Date()].join(' - ') );
    await report.save();
};

const Monitor = {
    interval_timeouts : {},
    create_check : function(check_doc){
        const interval_function = this.create_interval_function(check_doc);
        const timeout = setInterval(interval_function,check_doc.interval);
        this.interval_timeouts[check_doc._id] = timeout;
    },
    update_check : function(check_doc){
        clearInterval(this.interval_timeouts[check_doc._id]);
        this.create_check(check_doc);
    },
    delete_check : function(check_id){
        clearInterval(this.interval_timeouts[check_id]);
        delete this.interval_timeouts[check_id];
    },
    create_interval_info : function(check_doc){
        const options = {};
        options.timeout = check_doc.timeout;
        if(check_doc.path)
            options.path = check_doc.path;
        if(check_doc.port)
            options.port = check_doc.port;
        if(check_doc.authentication)
            options.auth = check_doc.authentication.username+':'+check_doc.authentication.password;
        if(check_doc.httpHeaders.length)
        {
            let headers = {};
            for(const pair of check_doc.httpHeaders)
            {
                if(pair.method)
                {
                    options.method = pair.method;
                }
                else
                {
                    headers = Object.assign(headers,pair);
                }
            }
            options.headers = headers;
        }
        let assertion_function;
        if(check_doc.assert && check_doc.assert.statusCode)
        {
            assertion_function = (statusCode) => {
                return check_doc.assert.statusCode===statusCode;
            };
        }
        else
        {
            assertion_function = (statusCode) => {
                return 299-statusCode>=0 && 299-statusCode<=99;
            };
        }
        return [ options , assertion_function];
    },
    create_interval_function : function(check_doc){
        const [ options , assertion_function ] = this.create_interval_info(check_doc);
        const process_request = (req) => {
            req.on('error',(e)=>{
                console.log(check_doc.url,"request error:",e.message);
            });
            req.on('timeout',()=>{
                req.destroy('Request timed out.');
            });
            req.end();
            console.log('--HTTP request to url: '+check_doc.url);
        };
        const process_response = (res,method,start) => {
            const responseTime = Date.now()-start;
            const working = assertion_function(res.statusCode);
            console.log(check_doc.url,"-> working: ",working);
            updateReport(check_doc,working,res.statusCode,method,responseTime);
            let chunks = 0;
            res.on('data', (chunk) => {
                chunks++;
            });
            res.on('end', () => {
                console.log(check_doc.url,chunks,'chunks received. No more data in response.');
            });
        };
        switch(check_doc.protocol){
            case 'HTTP':
                return function(){
                    const start = Date.now();
                    let req;
                    req = http.request(check_doc.url,options,(res)=>{process_response(res,req.method,start);});
                    process_request(req);
                };
            case 'HTTPS':
                if(check_doc.ignoreSSL!==undefined)
                    options.rejectUnauthorized = check_doc.ignoreSSL;
                return function(){
                    const start = Date.now();
                    let req;
                    req = https.request(check_doc.url,options,(res)=>{process_response(res,req.method,start);});
                    process_request(req);
                };
        }
    }
};

module.exports = Monitor;