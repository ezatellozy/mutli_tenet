import { DataTypes, Optional, Model } from "sequelize";
import sequelize from "../../utils/database";

interface NewsAttrs {
    id: number;
    email: string;
}


interface NewsCreationAttrs extends Optional<NewsAttrs, 'id'> { }

class NewsLetter extends Model<NewsAttrs, Optional<NewsCreationAttrs, 'id'>> implements NewsAttrs {
    declare id: number
    declare email: string
}

NewsLetter.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: DataTypes.STRING,
}, {
    sequelize,
    modelName: "NewsLetter",
    underscored: true,
})


export default NewsLetter