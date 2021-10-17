const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')

const router = express.Router();
const { Post, Comment, Image, User, Hashtag } = require('../models')
const { isLoggedIn } =require('./middleware')


try {  //파일 만들기
    fs.accessSync('uploads');
} catch(err) {
    console.log('uploads폴더가 없으므로 생성합니다.')
    fs.mkdirSync('uploads')
}



//나중에 여기 s3로 바꾸어줌.
const upload = multer({  
    storage: multer.diskStorage({  //지금은 하드디스크에 저장  나중엔 aws에 맡김
        destination(req,file,done) {
            done(null, 'uploads')
        },
        filename(req, file, done) { //파일명 저장   그림.png
            const ext = path.extname(file.originalname); //확장자추출 .png 
            const basename = path.basename(file.originalname, ext) // 그림
            done(null, basename + '_' + new Date().getTime() + ext) // 그림2010934.png
        },
    }),
    limits: { fileSize: 20 * 1024 * 1024 }, //용량제한
})

router.post('/',isLoggedIn, upload.none(), async (req,res,next) => {
    try {
        const hashtags = req.body.content.match(/#[^\s#]+/g);
        const post = await Post.create({
            content: req.body.content,
            UserId: req.user.id
        })  

        if(hashtags) {                                  //create와는 다르게 없으면 등록하고 있으면 무시
            const result = await Promise.all(hashtags.map((tag) => Hashtag.findOrCreate({ 
                    where: { name: tag.slice(1).toLowerCase() },  // [[#해시태그, true], [#해시태2, false]]  이렇게 나옴
                })))
            await post.addHashtags(result.map((v) => v[0]))
        }
        if(req.body.image) {
            if(Array.isArray(req.body.image)) { //이미지 두개이상인경우 image:[img1, img2]
                const images = await Promise.all(req.body.image.map((image) => Image.create({ src:image }))) //db에는 파일 이름만 넣는다.
                await post.addImages(images);
             } else { //이미지 한개인 경우 image:img1
                const image = await Image.create({ src:req.body.image })
                await post.addImages(image);
            }
        }
        const fullPost = await Post.findOne({
            where: { id: post.id },
            include: [{
                model:Image
            }, {
                model: Comment, 
                include: [{
                    model:User, //댓글 작성자
                    attributes: ['id','nickname']
                }]
            }, {
                model: User, //게시글 작성자
                attributes: ['id','nickname']
            }, {
                model:User, //좋아요 누른사람ㅡ
                as:'Likers',
                attributes: ['id']
            }]
        })
        res.status(201).json(fullPost);

    } catch(err) {
        console.error(err)
        next(err)
    }
   
})

router.get('/:postId', async (req,res,next) => {
    try {
        console.log("잘왔냐:" + req.params.postId)
        const post = await Post.findOne({
          where: { id: req.params.postId },
        });
        
        if (!post) {
          return res.status(404).send('존재하지 않는 게시글입니다.');
        }
     
        const fullPost = await Post.findOne({
          where: { id: post.id },
          include: [{
            model: Post,
            as: 'Retweet',
            include: [{
              model: User,
              attributes: ['id', 'nickname'],
            }, {
              model: Image,
            }]
          }, {
            model: User,
            attributes: ['id', 'nickname'],
          }, {
            model: Image,
          }, {
            model: Comment,
            include: [{
              model: User,
              attributes: ['id', 'nickname'],
            }],
          },{
              model: User,
              as: "Likers",
              attributes: ["id"]
          }],
        })

        console.log(fullPost)
        res.status(200).json(fullPost);
      } catch (error) {
        next(error);
      }
})

router.post('/:postId/comment',isLoggedIn, async (req,res,next) => {
    try {
        const post = await Post.findOne({
            where: { id: req.params.postId },
        })

        if(!post) {
            return res.status(403).send('존재하지 않는 게시글입니다.')
        }

        const comment = await Comment.create({
            content: req.body.content,
            PostId: parseInt(req.body.postId, 10),
            UserId: req.user.id //passport의 deserializeUser에서 옵니다.
        })

        const fullComment = await Comment.findOne({
            where: { id: comment.id },
            include: [{
                model: User,
                attributes: ['id','nickname']
            }]
        })
 
        res.status(201).json(fullComment);
        
    } catch(err) {
        console.error(err)
        next(err)
    }
   
})

router.delete('/:postId',isLoggedIn, async (req,res) => {
    try {
        await Post.destroy({
            where: { id:req.params.postId },
            UserId: req.user.id,   //보안을 철저히하기위해 자기게시글인 것중에 가져온다.
        })
        res.json({ PostId: parseInt(req.params.postId, 10) })
    } catch(err){
        console.error(err)
        next(err)
    }
})


router.patch('/:postId/like',isLoggedIn, async (req,res,next) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.postId }})
        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다')
        }
        await post.addLikers(req.user.id); // sequelize에서 만들어주는 함수
        res.json({ PostId: post.id, UserId:req.user.id })
    } catch(err) {
        console.error(err)
        next(err)
    }
})

router.delete('/:postId/unlike',isLoggedIn, async (req,res,next) => {
    try {
        const post = await Post.findOne({ where: { id: req.params.postId }})
        if (!post) {
            return res.status(403).send('게시글이 존재하지 않습니다')
        }
        await post.removeLikers(req.user.id); // sequelize에서 만들어주는 함수
        res.json({ PostId: post.id, UserId:req.user.id })
     } catch(err) {
         console.error(err)
         next(err)
     }
})


                                    //한장만 올릴거면 upload.single
router.post('/images', isLoggedIn, upload.array('image'), async (req,res,next) => {
    console.log(req.files) //업로드된 파일에 대한 정보
    res.json(req.files.map((v) => v.filename))
});

router.post('/:postId/retweet',isLoggedIn, async (req,res,next) => {
    try {
        const post = await Post.findOne({
          where: { id: req.params.postId },
          include: [{
            model: Post,
            as: 'Retweet',
          }],
        });
        if (!post) {
          return res.status(403).send('존재하지 않는 게시글입니다.');
        }
        if (req.user.id === post.UserId || (post.Retweet && post.Retweet.UserId === req.user.id)) {
          return res.status(403).send('자신의 글은 리트윗할 수 없습니다.');
        }
        const retweetTargetId = post.RetweetId || post.id;
        const exPost = await Post.findOne({
          where: {
            UserId: req.user.id,
            RetweetId: retweetTargetId,
          },
        });
        if (exPost) {
          return res.status(403).send('이미 리트윗했습니다.');
        }
        const retweet = await Post.create({
          UserId: req.user.id,
          RetweetId: retweetTargetId,
          content: 'retweet',
        });
        const retweetWithPrevPost = await Post.findOne({
          where: { id: retweet.id },
          include: [{
            model: Post,
            as: 'Retweet',
            include: [{
              model: User,
              attributes: ['id', 'nickname'],
            }, {
              model: Image,
            }]
          }, {
            model: User,
            attributes: ['id', 'nickname'],
          }, {
            model: Image,
          }, {
            model: Comment,
            include: [{
              model: User,
              attributes: ['id', 'nickname'],
            }],
          },{
              model: User,
              as: "Likers",
              attributes: ["id"]
          }],
        })
        res.status(201).json(retweetWithPrevPost);
      } catch (error) {
        console.error(error);
        next(error);
      }
})

module.exports = router;