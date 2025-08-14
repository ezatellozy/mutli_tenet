import { Sequelize } from "sequelize";

import { blogsAssociations, registerBlogModels } from "./blogs/blogs";
import { registerSectionModels } from "./blogs/sections";

const modelCache = new WeakMap<Sequelize, any>();

export function initTenantModels(sequelize: Sequelize): any {
  const cached = modelCache.get(sequelize);
  if (cached) return cached;

  const { Blog, BlogTranslate } = registerBlogModels(sequelize);
  const { BlogSection, BlogSectionsTranslate } =
    registerSectionModels(sequelize);

  const models = {
    Blog,
    BlogTranslate,
    BlogSection,
    BlogSectionsTranslate,
  };

  blogsAssociations(models);

  modelCache.set(sequelize, models);
  return models;
}
