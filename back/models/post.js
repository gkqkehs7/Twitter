module.exports = (sequelize, DataTypes) => {
    const Post = sequelize.define('Post', { //Mysql에는 posts테이블로 된다 (소문자+복수)
        content: {
            type: DataTypes.TEXT, //글자무제한
            allowNull:false,
        },
    }, {
        charset: 'utf8mb4', //이모티콘 사용가능
        collate: 'utf8mb4_general_ci' 
    });

    
    Post.associate = (db) => {
        db.Post.belongsTo(db.User); //게시글은 사람한명에게 속해잇음 게시글주인은 한명 
        db.Post.belongsToMany(db.Hashtag, { through: 'PostHashtag'}) //둘다 다수
        db.Post.hasMany(db.Comment);
        db.Post.hasMany(db.Image);
        db.Post.belongsToMany(db.User, { through: 'Like', as:'Likers'}) //post에 좋아요 누른사람들
        db.Post.belongsTo(db.Post, { as: 'Retweet' })
    };
    return Post
}