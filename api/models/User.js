const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

userSchema.pre(
    'save',
    async function(next) {
        const user = this;
        try
        {
            const hash = await bcrypt.hash(this.password, 12);
            this.password = hash;
            next();
        }
        catch(error)
        {
            next(error);
        }
    }
);

userSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  return compare;
}

module.exports = mongoose.model('User',userSchema);
