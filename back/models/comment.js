module.exports = (sequelize, DataTypes) => {
    const Comment = sequelize.define('Comment', { //Mysql에는 Comments테이블로 된다 (소문자+복수)
        content: {
            type: DataTypes.TEXT, //글자무제한
            allowNull:false,
        },
    }, {
        charset: 'utf8mb4', //이모티콘 사용가능
        collate: 'utf8mb4_general_ci' 
    });

    Comment.associate = (db) => {
        db.Comment.belongsTo(db.User);
        db.Comment.belongsTo(db.Post);
    };

    return Comment;
}