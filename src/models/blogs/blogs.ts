import { DataTypes, HasManyGetAssociationsMixin, Model, Optional } from "sequelize";
import sequelize from "../../../utils/database";
import {
  BlogSection,
  BlogSectionsTranslate
} from "./sections"

// Define Blog attributes
interface BlogAttributes {
  id: number;
  image: string;
  date: Date | null;
  updated_at?: Date;
  type: string
  by: string;
  is_published: boolean;
  blog_translations?: BlogTranslateAttributes[]
}

interface BlogCreationAttributes extends Optional<BlogAttributes, "id" | "is_published"> { }

// Blog model
class Blog extends Model<BlogAttributes, BlogCreationAttributes> implements BlogAttributes {
  declare id: number;
  declare image: string;
  declare type: string;
  declare date: Date;
  declare is_published: boolean;
  declare by: string;
  declare readonly created_at: Date;
  declare readonly updated_at: Date;

  declare blogs_translations: BlogTranslate[]; // Add BlogTranslate association
  declare get_blogs_translations: HasManyGetAssociationsMixin<BlogTranslate>; // Sequelize mixin for associations

}

Blog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    by: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_published: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "blog",
  }
);

// Define BlogTranslate attributes
interface BlogTranslateAttributes {
  id: number;
  blog_id: number;
  locale: string;
  title: string;
  desc: string;
  short_desc: string;
  slug: string;
  type: string;
}

interface BlogTranslateCreationAttributes extends Optional<BlogTranslateAttributes, "id"> { }

class BlogTranslate
  extends Model<BlogTranslateAttributes, BlogTranslateCreationAttributes>
  implements BlogTranslateAttributes {
  declare id: number;
  declare blog_id: number;
  declare locale: string;
  declare title: string;
  declare desc: string;
  declare short_desc: string;
  declare slug: string;
  declare type: string;

  declare readonly created_at: Date;
  declare readonly updated_at: Date;
}

BlogTranslate.init(
  {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    blog_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,

    },
    locale: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    desc: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    short_desc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    underscored: true,
    modelName: "blogs_translations",
  }
);


export const blogsAssociations = () => {
  // Relationships
  BlogTranslate.belongsTo(Blog, { foreignKey: "blog_id", onDelete: "CASCADE" });
  Blog.hasMany(BlogTranslate, { foreignKey: "blog_id", onDelete: "CASCADE" });
  BlogSectionsTranslate.belongsTo(BlogSection, { foreignKey: "section_id", onDelete: "CASCADE" });
  BlogSection.hasMany(BlogSectionsTranslate, { foreignKey: "section_id", onDelete: "CASCADE" });
  Blog.hasMany(BlogSection, { foreignKey: "blog_id", onDelete: "CASCADE" });
  BlogSection.belongsTo(Blog, { foreignKey: "blog_id", onDelete: "CASCADE" });

}


export { Blog, BlogTranslate };
