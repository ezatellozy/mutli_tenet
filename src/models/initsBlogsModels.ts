import { Sequelize } from "sequelize";
import { blogsAssociations, registerBlogModels } from "./blogs/blogs";
import { registerSectionModels } from "./blogs/sections";

export function initTenantModels(sequelizeInstance: Sequelize) {
  // سجل الموديلات
  const blogModels = registerBlogModels(sequelizeInstance);
  const sectionModels = registerSectionModels(sequelizeInstance);

  const models = {
    ...blogModels,
    ...sectionModels,
  };

  // أربط العلاقات
  blogsAssociations(models);
  //   sectionAssociations(models);

  return models;
}

// export const blogsAssociations = (models: any) => {
//     const { Blog, BlogTranslate, BlogSection, BlogSectionsTranslate } = models;

//     // Blog ↔ BlogTranslate
//     BlogTranslate.belongsTo(Blog, { foreignKey: "blog_id", onDelete: "CASCADE" });
//     Blog.hasMany(BlogTranslate, { foreignKey: "blog_id", onDelete: "CASCADE" });

//     // BlogSection ↔ BlogSectionsTranslate
//     BlogSectionsTranslate.belongsTo(BlogSection, {
//       foreignKey: "section_id",
//       onDelete: "CASCADE",
//     });
//     BlogSection.hasMany(BlogSectionsTranslate, {
//       foreignKey: "section_id",
//       onDelete: "CASCADE",
//     });

//     // Blog ↔ BlogSection
//     Blog.hasMany(BlogSection, { foreignKey: "blog_id", onDelete: "CASCADE" });
//     BlogSection.belongsTo(Blog, { foreignKey: "blog_id", onDelete: "CASCADE" });
//   };
