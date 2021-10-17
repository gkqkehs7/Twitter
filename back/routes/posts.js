const express = require('express');
const { Op } = require('sequelize')
const router = express.Router();
const { Post, User, Image, Comment } = require('../models')

router.get('/',async (req,res,next) => {
    try {
        const where = {};
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

module.exports = router;