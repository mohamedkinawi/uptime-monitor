const mongoose = require('mongoose');

const checkSchema = new mongoose.Schema({
    owner_email: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    protocol: {
        type: String,
        required: true,
        enum: ['HTTP', 'HTTPS']
    },
    path: String,
    port: Number,
    webhook: String,
    timeout: {
        type: Number,
        default: 5*1000
    },
    interval: {
        type: Number,
        default: 10*60*1000
    },
    threshold: {
        type: Number,
        default: 1
    },
    authentication: {
        username: { type: String },
        password: { type: String }
    },
    httpHeaders: [mongoose.Schema.Types.Mixed],
    assert: { statusCode: { type: String } },
    tags: [String],
    ignoreSSL: Boolean
});

checkSchema.pre(
    'validate',
    function(next) {
        if(this.interval)
        {
            this.interval = this.interval * 60 * 1000;
            if(this.interval<30000)
            {
                console.log('interval less than 30s!');
                next(new Error('interval must be >=0.5m'));
            }
        }
        if(this.timeout)
        {
            this.timeout *= 1000;
            if(this.timeout<5000)
            {
                console.log('timeout less than 5s!');
                next(new Error('timeout must be >=5s'));
            }
        }
        if(this.protocol)
        {
            this.protocol = this.protocol.toUpperCase();
        }
        next();
    }
);

checkSchema.post(
    'find',
    function(docs) {
        docs = docs.map(doc=>{
            doc.interval = doc.interval /(60*1000);
            doc.timeout = doc.timeout / 1000;
        });
    }
);

checkSchema.post(
    'findOne',
    function(doc) {
        if(doc)
        {
            doc.interval = doc.interval /(1000*60);
            doc.timeout = doc.timeout / 1000;
        }
    }
);

module.exports = mongoose.model('Check',checkSchema);
