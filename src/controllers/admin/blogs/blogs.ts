import { Blog, BlogTranslate } from "../../../models/blogs/blogs";

import { Request, Response } from "express";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { upsertBlogTranslations } from "./helper";
import { createSection } from "./sections";
import { BlogResource } from "../../../response/admin/blogs/BlogsResource";
import { getById, getIndexWithPaginate } from "../../../services/blogs";
import { BlogSection } from "../../../models/blogs/sections";

export const createBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { image, date, is_published, by, ar, en, sections } = req.body;

  const transaction = await sequelize.transaction();
  try {
    const errors: string[] = [];

    if (!image) {
      errors.push("Blog image is required");
    }
    if (!date) {
      errors.push("Publish date is required");
    }
    if (!by) {
      errors.push("Author is required");
    }
    if (!en?.type) {
      errors.push("type en is required");
    }
    if (!ar?.type) {
      errors.push("type ar is required");
    }

    if (errors.length) {
      ResponseHandler.error(res, errors[0], 422, errors);

      return;
    }

    const blogData = await Blog.create(
      {
        image,
        date,
        is_published: is_published ?? false,
        by,
        type: en?.type
      },
      { transaction }
    );

    await Promise.all([
      upsertBlogTranslations(blogData.id, { ar }, transaction),
      upsertBlogTranslations(blogData.id, { en }, transaction),
    ]);

    if (Array.isArray(sections)) {
      await Promise.all(
        sections.map(
          async (section) =>
            await createSection(section, transaction, blogData.id)
        )
      );
    }

    transaction.commit();

    ResponseHandler.success(res, blogData.get(), "Blog created successfully");
  } catch (error) {
    transaction.rollback();
    if (error instanceof Error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        if ("fields" in error) {
          const sqlError = error as { fields: { [key: string]: string } };
          const validtionError: string[] = [];
          Object.keys(sqlError.fields).forEach((field) => {
            validtionError.push(`${field} must be unique`);
          });
          ResponseHandler.error(res, validtionError[0], 422, validtionError);
        }
      } else {
        ResponseHandler.error(
          res,
          error instanceof Error ? error.message : "Failed to create blog"
        );
      }
    }
  }
};

export const updateBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;

  const transaction = await sequelize.transaction();

  try {
    const { image, date, is_published, by, ar, en, sections } = req.body;

    const errors: string[] = [];

    if (!date) {
      errors.push("Publish date is required");
    }
    if (!by) {
      errors.push("Author is required");
    }

    if (errors.length) {
      ResponseHandler.error(res, errors[0], 422, errors);

      return;
    }

    const blogData = await Blog.findByPk(id);

    if (!blogData) {
      ResponseHandler.error(res, "Blog not found", 404);

      return;
    }

    await blogData.update(
      {
        ...(date && { date: date }),
        ...(image && { image: image }),
        ...(is_published && { is_published: is_published }),
        ...(by && { by: by }),
        ...(en?.blog && { type: en.type }),
      },
      { transaction }
    );

    await upsertBlogTranslations(blogData.id, { ar }, transaction);
    await upsertBlogTranslations(blogData.id, { en }, transaction);

    if (Array.isArray(sections)) {
      for (const section of sections) {
        await createSection(section, transaction, blogData.id);
      }
    }

    transaction.commit();
    const updatedTranslations = await BlogTranslate.findAll({
      where: { blog_id: id },
    });

    const translationsByLocale = updatedTranslations.reduce(
      (acc, translation) => {
        acc[translation.locale] = translation;
        return acc;
      },
      {} as Record<string, (typeof updatedTranslations)[number]>
    );

    res.status(200).json({
      message: "Blog and translations updated successfully",
      data: {
        ...blogData.get(),
        ar: translationsByLocale["ar"] || null,
        en: translationsByLocale["en"] || null,
      },
    });
    return;
  } catch (error) {
    transaction.rollback();
    if (error instanceof Error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        if ("fields" in error) {
          const sqlError = error as { fields: { [key: string]: string } };
          const validtionError: string[] = [];
          Object.keys(sqlError.fields).forEach((field) => {
            validtionError.push(`${field} must be unique`);
          });
          ResponseHandler.error(res, validtionError[0], 422, validtionError);
        }
      } else {
        ResponseHandler.error(
          res,
          error instanceof Error ? error.message : "Failed to create blog"
        );
      }
    }
  }
};

export const deleteBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const blog = await Blog.findByPk(req.params.id);

  if (!blog) {
    ResponseHandler.error(res, "Blog not found", 404);

    return;
  }
  await blog
    .destroy()
    .then(() => ResponseHandler.deleted(res, "Blog deleted successfully"))
    .catch((error) =>
      ResponseHandler.error(
        res,
        error instanceof Error
          ? error.message || "Blog not found"
          : "Blog not found",
        500
      )
    );
};
export const deleteSectionBlog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const section = await BlogSection.findByPk(req.params.id);

  if (!section) {
    ResponseHandler.error(res, "section not found", 404);

    return;
  }
  await section
    .destroy()
    .then(() => ResponseHandler.deleted(res, "Section deleted successfully"))
    .catch((error) =>
      ResponseHandler.error(
        res,
        error instanceof Error
          ? error.message || "section not found"
          : "section not found",
        500
      )
    );
};

export const getBlogById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = +req.params.id;

    const blog = await getById(id);

    if (!blog) {
      ResponseHandler.error(res, "Blog not found", 404);
      return;
    }

    ResponseHandler.success(
      res,
      BlogResource.make(blog, req, {
        includeSections: true,
        includeTranslations: true,
      })
    );
  } catch (error) {
    ResponseHandler.error(
      res,
      error instanceof Error ? error.message : "Server error"
    );
  }
};

export const getAllBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const currentPage = +req.params.page || 1;
    const perPage = 15;
    const blogs = await getIndexWithPaginate(currentPage, perPage, req);
    if (!blogs) {
      ResponseHandler.error(res, "No blogs found", 404);

      return;
    }


    ResponseHandler.paginated(
      res,
      BlogResource.collectionWithPagination(
        blogs,
        req,
        {},
        currentPage,
        perPage
      )
    );
  } catch (err) {
    ResponseHandler.error(
      res,
      err instanceof Error ? err.message : "Failed to fetch a blog",
      404
    );
  }
};
