module.exports = (sequelize, DataTypes) => {
    const Hashtag = sequelize.define('Hashtag', { //Mysql에는 Hashtags테이블로 된다 (소문자+복수)
        name: {
            type:DataTypes.STRING(20),
            allowNull: false
        },
    }, {
        charset: 'utf8mb4', //이모티콘 사용가능
        collate: 'utf8mb4_general_ci' 
    });
    Hashtag.associate = (db) => {
        db.Hashtag.belongsToMany(db.Post, { through: 'PostHashtag' });
    };
    return Hashtag;
}