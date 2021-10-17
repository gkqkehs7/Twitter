module.exports = (sequelize, DataTypes) => {
    const Image = sequelize.define('Image', { //Mysql에는 Images테이블로 된다 (소문자+복수)
        src: {
            type: DataTypes.STRING(200), //글자무제한
            allowNull:false,
        },
    }, {
        charset: 'utf8', //이모티콘 사용가능
        collate: 'utf8_general_ci' 
    });
    Image.associate = (db) => {
        db.Image.belongsTo(db.Post);
    };
    return Image
}