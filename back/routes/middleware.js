exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()) { //passport에서 제공
        next()  //next안에 아무인자도 안쓰면 다음미들웨어, 쓰면 에러 미들웨어
    } else {
        res.status(401).send('로그인이 필요합니다.');    
    }
}

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        console.log('들어옴')
        next()
    } else {
        res.status(401).send('로그인 하지 않은 사용자만 접근 가능합니다.');    
    }
}