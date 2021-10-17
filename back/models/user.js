module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', { //Mysql에는 users테이블로 된다 (소문자+복수)
        email: {
            type: DataTypes.STRING(30),
            allowNull: false, //필수
            unique: true //중복불가
        },
        nickname: {
            type: DataTypes.STRING(30),
            allowNull: false, //필수
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false, //필수
        }
    }, {
        charset: 'utf8',
        collate: 'utf8_general_ci' //한글사용가능
    });
    User.associate = (db) => {
        db.User.hasMany(db.Post); //사람이 여러개의 포스트를 작성할 수 있다.
        db.User.hasMany(db.Comment); //사람이 여러개의 댓글을 작성할 수 있다.
        db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag' });
        db.User.belongsToMany(db.Post, { through: 'Like', as: 'Liked'} ) //좋아요 누름 게시글들
        db.User.belongsToMany(db.User, { through: 'Follow', as: 'Followers', foreignKey: 'FollowingId' })
        db.User.belongsToMany(db.User, { through: 'Follow', as: 'Followings', foreignKey: 'FollowerId' })
      
    };

    return User;
}