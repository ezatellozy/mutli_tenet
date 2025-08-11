import { Request } from "express";
import { Blog, BlogTranslate } from "../../../models/blogs/blogs";

import { BlogSectionResource } from "../../../response/admin/blogs/BlogSectionResource"
import { formattedDate } from "../../../../utils/helpers";

const getUrl = (req: Request, type: string, media: string | null): string | null =>
    media ? `${req.protocol}://${req.get("host")}/${type}/blogs/${media.replace(/\\/g, "/")}` : null;

const reduceTranslations = <T extends { locale: string }>(
    items: T[]
): Record<string, Omit<T, 'locale'>> =>
    items.reduce((acc, { locale, ...rest }) => {
        acc[locale] = rest;
        return acc;
    }, {} as Record<string, Omit<T, 'locale'>>);

interface ResourceOptions {
    includeSections?: boolean;
    includeTranslations?: boolean;
}

export class BlogResource {
    private blog: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string

    constructor(blog: Blog, req: Request, options: ResourceOptions = {}) {
        this.blog = blog.get ? blog.get({ plain: true }) : blog;
        this.req = req;
        this.lang = req.headers['accept-language'] ?? 'en';
        this.options = {
            includeSections: false,
            includeTranslations: false,
            ...options,
        };
    }

    toJSON() {
        const {
            id,
            type,
            image,
            by,
            is_published,
            date,
            updated_at,

            blogs_translations = [],
            blogs_sections = []
        } = this.blog;







        const translations = reduceTranslations(blogs_translations as BlogTranslate[]);

        const result: Record<string, any> = {
            id,
            type,
            by,
            is_published,
            date: date ? formattedDate(date) : null,
            updated_at: updated_at ? formattedDate(updated_at) : null,


            image: getUrl(this.req, "images", image),
        };

        if (this.options.includeTranslations) {
            result.ar = translations['ar'] || null;
            result.en = translations['en'] || null;
        } else {
            Object.assign(result, {
                slug: translations[this.lang]?.slug ?? '',
                title: translations[this.lang]?.title ?? '',
                desc: translations[this.lang]?.desc ?? '',
                short_desc: translations[this.lang]?.short_desc ?? '',
                type: translations[this.lang]?.type ?? '',
            })
        }

        if (this.options.includeSections) {
            result.sections = BlogSectionResource.collection(blogs_sections, this.req, this.options).data;
        }

        return result;
    }

    static make(item: Blog, req: Request, options: ResourceOptions = {}) {
        return new BlogResource(item, req, options).toJSON()
    }

    static collection(items: Blog[], req: Request, options: ResourceOptions = {}) {
        return {
            data: items.map(item => new BlogResource(item, req, options).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map(item => new BlogResource(item, req, options).toJSON()),
                    meta,
                };
            }
        };
    }

    static collectionWithPagination(
        paginatedResult: {
            rows: any[];
            count: number;
        },
        req: Request,
        options: ResourceOptions = {},
        currentPage: number,
        perPage: number,
    ) {
        const total = paginatedResult.count;
        const lastPage = Math.ceil(total / perPage);

        return {
            data: paginatedResult.rows.map(item => new BlogResource(item, req, options).toJSON()),
            meta: {
                current_page: currentPage,
                per_page: perPage,
                total,
                last_page: lastPage,
            },
            links: {
                first: `?page=1`,
                last: `?page=${lastPage}`,
                prev: currentPage > 1 ? `?page=${currentPage - 1}` : null,
                next: currentPage < lastPage ? `?page=${currentPage + 1}` : null,
            }
        };
    }
}
