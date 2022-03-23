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
        enum: ['HTTP', 'HTTPS', 'TCP']
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
        if(this.protocol)
        {
            this.protocol = this.protocol.toUpperCase();
        }
        if(this.interval<30000)
        {
            console.log('interval less than 30s!');
            next(new Error('interval must be >=0.5m'));
        }
        if(this.timeout<5000)
        {
            console.log('timeout less than 5s!');
            next(new Error('timeout must be >=5s'));
        }
        next();
    }
);

checkSchema.post(
    'find',
    function(doc) {
        doc.interval = doc.interval /(1000*60);
        doc.timeout = doc.timeout / 1000;
    }
);

checkSchema.post(
    'findOne',
    function(doc) {
        doc.interval = doc.interval /(1000*60);
        doc.timeout = doc.timeout / 1000;
    }
);

module.exports = mongoose.model('Check',checkSchema);
