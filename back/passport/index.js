const passport = require('passport');
const local = require('./local')
const { User } = require('../models')

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user.id)
    });

    //router실행되기전 매번 실행
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findOne({ where: {id} })
            done(null, user)  //req.user 안에 넣어준다,
        } catch(err) {
            console.error(err);
            done(err)
        }
        
    });
    local();
}