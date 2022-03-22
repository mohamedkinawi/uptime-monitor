const nodemailer = require('nodemailer');

exports.sendEmail = async (options) =>
{
    console.log("Trying to send email",options);
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        }
    });
    await transporter.sendMail(options);
    console.log("Email sent!");
}

exports.consumeWebHook = (url,check) => {
    console.log("Consuming webhook:",url);
    const req = https.request(url,{
        method:'POST',
        headers:{'Content-Type':'application/json'}
    });
    req.on('error', (e) => {
        console.log(`webhook request error: ${e.message}`);
    });
    req.write(JSON.stringify({ check }));
    req.end();
};

//add more alerts here