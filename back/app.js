const express = require('express')
const cors = require('cors')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const dotenv = require('dotenv');
const morgan = require('morgan')
const postsRouter = require('./routes/posts')
const postRouter = require('./routes/post')
const userRouter = require('./routes/user')
const hashtagRouter = require('./routes/hashtag')
const db = require('./models')
const path = require('path')

const passportConfig = require('./passport');


dotenv.config();
const app = express();

db.sequelize.sync() //db설정
    .then(() => {
        console.log('db 연결 성공')
    })
    .catch(console.error)

passportConfig(); //passport설정

app.use(morgan('dev'))
app.use(cors({ //front에서 오는 쿠키를 백앤드에서 처리할 수 있게 만들어줌
    origin: 'http://localhost:3060',
    credentials: true
}))
app.use('/',express.static(path.join(__dirname, 'uploads'))) //운영체제에 맞게
app.use(express.json());
app.use(express.urlencoded({ extended:true })) //front에서 보낸 데이터를 req.body에 넣어줌

app.use(session({
    saveUninitialized: false,
    resave: false,
    secret: process.env.COOKIE_SECRET
}));
app.use(cookieParser(process.env.COOKIE_SECRET))
app.use(passport.initialize());
app.use(passport.session());

app.get('/', (req,res) => {
    res.send('Hello express')
})

app.use('/post', postRouter);
app.use('/posts', postsRouter);
app.use('/user', userRouter);
app.use('/hashtag', hashtagRouter)

app.listen(3065, () => {
    console.log('서버 실행 중')
})