import { DataTypes, HasManyGetAssociationsMixin, Model, Optional } from "sequelize";
import sequelize from "../../../utils/database";

// Define Blog attributes
interface BlogSectionAttributes {
  id: number;
  image?: string;
  blog_id: number;
  blog_translations?: BlogSectionTranslateAttributes[]
}

interface BlogSectionCreationAttributes extends Optional<BlogSectionAttributes, "id"> { }

// Blog model
class BlogSection extends Model<BlogSectionAttributes, Optional<BlogSectionCreationAttributes, 'id'>> implements BlogSectionAttributes {
  declare id: number;
  declare image: string;
  declare blog_id: number;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;
  declare blog_setions_translations: BlogSectionsTranslate[];
  declare get_blog_setions_translations: HasManyGetAssociationsMixin<BlogSectionsTranslate>;

}

BlogSection.init(
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
    blog_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    }

  },
  {
    sequelize,
    underscored: true,
    modelName: "blogs_section",
  }
);

// Define BlogTranslate attributes
interface BlogSectionTranslateAttributes {
  id: number;
  section_id: number;
  locale: string;
  title: string;
  desc: string;

}

interface BlogSectionTranslateCreationAttributes extends Optional<BlogSectionTranslateAttributes, "id"> { }

class BlogSectionsTranslate
  extends Model<BlogSectionTranslateAttributes, Optional<BlogSectionTranslateCreationAttributes, 'id'>>
  implements BlogSectionTranslateAttributes {
  declare id: number;
  declare section_id: number;
  declare locale: string;
  declare title: string;
  declare desc: string;
  declare image: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

BlogSectionsTranslate.init(
  {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    section_id: {
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
    modelName: "blogs_sections_translation",
    underscored: true,
  }
);




export { BlogSection, BlogSectionsTranslate };
