import { Request, Response } from "express";
import { ResponseHandler } from "../../../utils/responseHandler";
import { BlogResource } from "../../response/admin/blogs/BlogsResource";
import { getBySlug, getIndexWithPaginate } from "../../services/blogs";
// import { Blog, BlogTranslate } from "../../models/blogs/blogs";
import { Op } from "sequelize";

export const getBlogBySlug = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const lang = req.headers["accept-language"] ?? "en";
    const slug = req.params.slug;
    const blog = await getBySlug(slug, lang);

    // if (!blog) {
    //   ResponseHandler.error(res, "blog not found", 404);
    //   return;
    // }

    // ResponseHandler.success(
    //   res,
    //   BlogResource.make(blog, req, {
    //     includeSections: true,
    //   })
    // );
  } catch (error) {
    ResponseHandler.error(
      res,
      error instanceof Error
        ? error.message
        : "An error occurred while fetching the service",
      500
    );
  }
};

// Handler to get all services
export const getAllBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const current_page = req.query.page
      ? parseInt(req.query.page as string)
      : 1;

    const blogs = await getIndexWithPaginate(current_page, 5, req);

    // Return the list of all services
    // ResponseHandler.paginated(
    //   res,
    //   BlogResource.collectionWithPagination(blogs, req, {}, current_page, 5)
    // );
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    ResponseHandler.error(
      res,
      "An error occurred while fetching the services",
      500
    );
  }
};
export const getFirstBlogs = async (
  req: Request,
  res: Response
): Promise<void> => {
  //   try {
  //     const lang = req.headers["accept-language"] ?? "en";
  //     const blogs = await Blog.findAll({
  //       include: [
  //         {
  //           model: BlogTranslate,
  //           attributes: ["title", "desc", "slug", "short_desc", "locale", "type"],
  //         },
  //       ],
  //       attributes: ["id", "date", "is_published", "image", "by"],
  //       limit: 3,
  //       order: [["date", "DESC"]],
  //       where: {
  //         [Op.and]: [
  //           {
  //             is_published: true,
  //           },
  //           {
  //             date: { [Op.lte]: new Date() },
  //           },
  //         ],
  //       },
  //       offset: 0,
  //     });
  //     const blogs_types = await Blog.findAll({
  //       include: [
  //         {
  //           model: BlogTranslate,
  //           where: {
  //             locale: lang,
  //           },
  //           attributes: ["type"],
  //         },
  //       ],
  //       where: {
  //         date: { [Op.ne]: null },
  //       },
  //       attributes: ["type", "id"],
  //       group: ["type", "id", "blogs_translations.id"],
  //     });
  //     const categories = blogs_types.flatMap((blog) =>
  //       blog.blogs_translations.map((trans) => ({
  //         type_key: blog.type,
  //         type: trans.type,
  //       }))
  //     );
  //     // Construct the response
  //     const response = {
  //       blogs: BlogResource.collection(blogs, req, {}).data,
  //       categories,
  //     };
  //     ResponseHandler.success(res, response);
  //   } catch (error) {
  //     // Handle unexpected errors
  //     console.error(error);
  //     ResponseHandler.error(
  //       res,
  //       "An error occurred while fetching the services",
  //       500
  //     );
  //   }
};

export const getBlogsRelatedToCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  //   try {
  //     const blog = await Blog.findByPk(req.params.id);
  //     if (!blog) {
  //       ResponseHandler.error(res, "blog not found", 404);
  //       return;
  //     }
  //     const blogs = await Blog.findAll({
  //       include: [
  //         {
  //           model: BlogTranslate,
  //           attributes: ["title", "desc", "slug", "short_desc", "locale", "type"],
  //         },
  //       ],
  //       attributes: ["id", "date", "is_published", "image", "by"],
  //       limit: 3,
  //       order: [["date", "DESC"]],
  //       where: {
  //         id: { [Op.ne]: blog.id },
  //         is_published: true,
  //         date: {
  //           [Op.lte]: new Date(),
  //         },
  //         type: blog.type,
  //       },
  //       offset: 0,
  //     });
  //     // Construct the response
  //     ResponseHandler.success(res, BlogResource.collection(blogs, req, {}).data);
  //   } catch (error) {
  //     // Handle unexpected errors
  //     console.error(error);
  //     ResponseHandler.error(
  //       res,
  //       "An error occurred while fetching the services",
  //       500
  //     );
  //   }
};
