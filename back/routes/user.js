const express = require('express');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize')
const { User, Post, Image, Comment, Hashtag} = require('../models')
const { isLoggedIn, isNotLoggedIn } = require('./middleware')
const passport = require('passport');
const db = require('../models');
const router = express.Router();

router.get('/', async (req,res,next) => {
    console.log(req.headers)
    try {
        if(req.user) {
            const fulluserWithoutPassword = await User.findOne({
                where: { id: req.user.id },
                attributes:{
                    exclude: ['password'] //특정데이터 제외하고 가져오기
                },
                include: [{
                    model: Post,
                    attributes: ['id'] //특정데이터만 가져오기
                }, {
                    model: User,
                    as: 'Followings',
                    attributes: ['id']
                }, {
                    model: User,
                    as: 'Followers',
                    attributes: ['id']
                }]
            })
            res.status(200).json(fulluserWithoutPassword)
        } else {
            res.status(200).json(null)
        }
        
    } catch(err) {
        console.error(err)
        next(err)
    }
})

router.post('/login',isNotLoggedIn, (req, res, next) => {
    
    passport.authenticate('local', (err, user, info) => {

        if(err) {
            console.error(err);
            return next(err)
        }

        if(info) {
            return res.status(401).send(info.reason)
        }

        return req.login(user, async (loginErr) => {
            if(loginErr) {
                return next(loginErr);
            }
            const fulluserWithoutPassword = await User.findOne({
                where: { id: user.id },
                attributes:{
                    exclude: ['password']
                },
                include: [{
                    model: Post,
                    attributes: ['id']
                }, {
                    model: User,
                    as: 'Followings',
                    attributes: ['id']
                }, {
                    model: User,
                    as: 'Followers',
                    attributes: ['id']
                }]
            })
            return res.status(200).json(fulluserWithoutPassword)
        })
        

    })(req, res, next)
});


router.post('/', isNotLoggedIn, async (req,res,next) => { // POST /user/
    try {
        console.log(req.body)
        const exUser= await User.findOne({
            where: {
                email: req.body.email,
            }
        }); //자기랑 똑같은 아이디 잇으면

        if(exUser) {
            return res.status(403).send('이미 사용중인 아이디입니다.') //403실패
        } //return 안붙이면 밑의 코드도 실행 응답 두번가면 에러임

        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        await User.create({
            email: req.body.email,
            nickname: req.body.nickname,
            password: hashedPassword,
        });  //await안하면 res.json()이 먼저 실행됨
        res.status(200).send('ok'); //200성공
    } catch (err) {
        console.log(err)
        next(err)
    }
    //bcrypt같이 비동기인지 아닌지 모르겠는 것들은 공식문서 찾아봐야한다.
    //await async 쓰는 것들은 try-catch로 묶어주자
    //next로 err를 묶어보내면 브라우저에서 확인가능해짐
    
})

router.post('/logout', isLoggedIn, (req,res,next) => {
    req.logout();
    req.session.destroy();
    res.send('ok');
});

router.patch('/nickname', isLoggedIn, async (req,res) => {
    try {
        await User.update({
            nickname: req.body.nickname, //닉네임을 프론트에서 받은 닉네임으로 바꾼다
        }, {
            where: {id:req.user.id}  //내아이디의 
        });
        res.status(200).json({ nickname: req.body.nickname });
    } catch(err){
        console.error(err)
        next(err)
    }
})







router.get('/followers', isLoggedIn, async (req,res) => { //팔로우
    try {
        const user = await User.findOne({ where: { id: req.user.id }})
        
        if(!user) {
            res.status(403).send('없는 사람을 팔로우하려고 하시네요')
        } 
        const followers = await user.getFollowers({
            limit: parseInt(req.query.limit, 10), 
        }); 
        res.status(200).json(followers);
    } catch(err){
        console.error(err)
        next(err)
    }
})


router.get('/followings', isLoggedIn, async (req,res) => { //팔로우
    try {
        const user = await User.findOne({ where: { id: req.user.id }})
        
        if(!user) {
            res.status(403).send('없는 사람을 팔로우하려고 하시네요')
        } 
        const followings = await user.getFollowings({
            limit: parseInt(req.query.limit, 10),
        }); 
        res.status(200).json(followings);
    } catch(err){
        console.error(err)
        next(err)
    }
})


router.delete('/follower/:userId', isLoggedIn, async (req,res) => { 
    try {
        const user = await User.findOne({ where: { id: req.params.userId }})
        
        if(!user) {
            res.status(403).send('없는 사람을 차단하려고 하시네요')
        } 
        await user.removeFollowings(req.user.id);
        res.status(200).json({ UserId: parseInt(req.params.userId, 10)})
    } catch(err){
        console.error(err)
        next(err)
    }
})


router.get('/:userId/posts',async (req,res,next) => {
    try {
        const where = { UserId: req.params.userId };
        if( parseInt(req.query.lastId, 10) ) {
            where.id = { [Op.lt]: parseInt(req.query.lastId, 10) } 
        }
        const posts = await Post.findAll({
            where,
            limit: 10,
            order: [['createdAt', 'DESC'],
                    [Comment, 'createdAt','DESC']    
                ],
            include: [{
                model: User,
                attribute: ['id','nickname']
            }, {
                model: Image,
            }, {
                model: Comment,
                include: [{
                    model: User,
                    attribute: ['id','nickname']
                }]
            },{
                model:User, //좋아요 누른사람ㅡ
                as:'Likers',
                attributes: ['id']
            },{
                model: Post,
                as: 'Retweet',
                include: [{
                  model: User,
                  attributes: ['id', 'nickname'],
                }, {
                  model: Image,
                }]
              },]
        });
        res.status(200).json(posts);
    } catch(err) {
        console.error(err)
        next(err)
    }

})
// : 이거 쓰는 것들은 다 밑에 내려주는게 좋다
router.patch('/:userId/follow', isLoggedIn, async (req,res) => { //팔로우
    try {
        const user = await User.findOne({ where: { id: req.params.userId }})
        
        if(!user) {
            res.status(403).send('없는 사람을 팔로우하려고 하시네요')
        } 
        await user.addFollowers(req.user.id); 
        res.status(200).json({ UserId: parseInt(req.params.userId) });
    } catch(err){
        console.error(err)
        next(err)
    }
})


router.delete('/:userId/follow', isLoggedIn, async (req,res) => { //팔로우 취소
    try {
        const user = await User.findOne({ where: { id: req.params.userId }})
        
        if(!user) {
            res.status(403).send('없는 사람을 언팔로우하려고 하시네요')
        } 
        console.log('도칙')
        await user.removeFollowers(req.user.id);
        res.status(200).json({ UserId: parseInt(req.params.userId) });
    } catch(err){
        console.error(err)
        next(err)
    }
})

module.exports = router;