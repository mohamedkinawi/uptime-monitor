const https = require('https');

/**FILL**/
const postData = JSON.stringify({
	email: ""
});

const options = {
	hostname: "immense-dawn-06846.herokuapp.com",
/**FILL**/ path: "/user/signup",
/**FILL**/ method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Content-Length': Buffer.byteLength(postData)
	}
};

/* // EXAMPLE OF HOW A CHECK CAN LOOK LIKE
check: {
		name:'test1',
		url: "https://www.ycombinator.com/",
		protocol: 'https',
		tags: ['test','check'],
		timeout: 10,
		interval: 0.5,
		threshold: 3
	}
*/

const req = https.request(options,(res)=>{
        console.log('response status code:',res.statusCode);
	let response_body='';
	res.on('data', (chunk) => {
        	response_body += chunk;
	});
	res.on('end', () => {
                console.log(JSON.parse(response_body));
	});
});

req.on('error',(e)=>{
	console.log("request error:",e.message);
});

req.write(postData);
console.log("Waiting for response...");
req.end();