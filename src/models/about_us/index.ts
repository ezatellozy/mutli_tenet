import {
  DataTypes,
  HasManyGetAssociationsMixin,
  Model,
  Optional,
} from "sequelize";
import sequelize from "../../../utils/database";

// Define Blog attributes
interface AboutAttributes {
  id: number;
  image?: string;
  video?: string;

  about_translations?: AboutTranslate[];

}

interface AboutCreationAttributes extends Optional<AboutAttributes, "id"> { }

// Blog model
class About
  extends Model<AboutAttributes, Optional<AboutCreationAttributes, "id">>
  implements AboutAttributes {
  declare id: number;
  declare image: string;
  declare video: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare about_translations: AboutTranslate[];
  declare get_about_translations: HasManyGetAssociationsMixin<AboutTranslate>;
}

About.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    video: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "about",
    tableName: "about",
  }
);

// Define BlogTranslate attributes
interface AboutTranslateAttributes {
  id: number;
  about_id: number;
  locale: string;
  title: string;
  desc: string;
}

interface AboutTranslateCreationAttributes
  extends Optional<AboutTranslateAttributes, "id"> { }

class AboutTranslate
  extends Model<
    AboutTranslateAttributes,
    Optional<AboutTranslateCreationAttributes, "id">
  >
  implements AboutTranslateAttributes {
  declare id: number;
  declare about_id: number;
  declare locale: string;
  declare title: string;
  declare desc: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

AboutTranslate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    about_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    locale: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    desc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "about_translation",
    tableName: "about_translations",
    underscored: true,
  }
);


export const aboutAssociations = () => {

  AboutTranslate.belongsTo(About, { foreignKey: 'about_id', onDelete: 'CASCADE' })
  About.hasMany(AboutTranslate, { foreignKey: 'about_id', onDelete: 'CASCADE' });

}

export { About, AboutTranslate };
