import { Op } from "sequelize";
import { Blog, BlogTranslate } from "../models/blogs/blogs";
import { BlogSection, BlogSectionsTranslate } from "../models/blogs/sections";
import { Request } from "express";

export const getIndex = async (limit?: number) => {

    return await Blog.findAll({
        include: [
            {
                model: BlogTranslate,
                attributes: ["title", "desc", "slug", 'short_desc', "locale", "type"],

            },
        ],
        attributes: ["id", "date", "is_published", "image", "by", 'updated_at'],
        ...(limit && { limit })

    })
}
export const getIndexWithPaginate = async (page: number, per_page?: number, req?: Request) => {
    const limit = per_page || 5;  // Number of items per page
    const offset = (page - 1) * limit;  // Calculate offset for pagination
    const keyword = req?.query.keyword as string || ''
    const type = req?.query.type as string || ''
    const whereCondition = keyword
        ? {
            [Op.or]: [
                { title: { [Op.like]: `%${keyword}%` } },
                { desc: { [Op.like]: `%${keyword}%` } },
            ]
        }
        : {};

    const typeCondition = type
        ? { type: { [Op.like]: `%${type}%` } }
        : {};  // If no type, no filter for type

    return Blog.findAndCountAll({
        include: [
            {
                model: BlogTranslate,
                attributes: ["title", "desc", "slug", 'short_desc', "locale", "type"],
                where: whereCondition

            },
            {
                model: BlogSection,
                attributes: ["image", "id"],
                include: [
                    {
                        model: BlogSectionsTranslate,
                        attributes: ['title', 'desc']
                    }
                ]
            }
        ],
        where: {
            ...typeCondition
        },
        limit,
        order: [['date', 'DESC']],
        offset,
        distinct: true,

        attributes: ["id", "date", "is_published", "image", "by"],
    })
}


export const getById = async (id: number) => {
    return await Blog.findByPk(id, {
        include: [
            {
                model: BlogTranslate,
                attributes: ["title", "desc", "slug", "locale", 'short_desc', "type"],
            },
            {
                model: BlogSection,
                attributes: ["image", "id"],
                include: [
                    {
                        model: BlogSectionsTranslate,
                        attributes: ["title", "desc", "locale"],
                    }
                ]
            }
        ],
        attributes: ["id", "date", "is_published", "image", "by"],
    });
}
export const getBySlug = async (slug: string, lang: string) => {
    const blog = await Blog.findOne({
        attributes: ['id'],
        include: {
            model: BlogTranslate,
            attributes: ["slug"],
            where: { slug: slug },
        }
    });

    if (!blog) {
        return null;
    }

    return await Blog.findByPk(blog.id, {
        include: [
            {
                model: BlogTranslate,
                where: { locale: lang },
                attributes: ["title", "desc", "slug", "locale", "short_desc", "type"],
            },
            {
                model: BlogSection,
                attributes: ["image", "id"],
                include: [
                    {
                        where: { locale: lang },
                        model: BlogSectionsTranslate,
                        attributes: ["title", "desc", "locale"],
                    },
                ],
            },
        ],
        attributes: ["id", "date", "is_published", "image", "by"],
    });
};
