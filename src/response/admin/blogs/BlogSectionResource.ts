import { Request } from "express";
import { BlogSection, BlogSectionsTranslate } from "../../../models/blogs/sections";

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
    includeTranslations?: boolean;
}

export class BlogSectionResource {
    private blog: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string

    constructor(blog: BlogSection, req: Request, options: ResourceOptions = {}) {
        this.blog = blog.get ? blog.get({ plain: true }) : blog;
        this.req = req;
        this.lang = req.headers['accept-language'] ?? 'en';
        this.options = {
            includeTranslations: true,
            ...options,
        };
    }

    toJSON() {
        const {
            id,
            image,
            blogs_sections_translations = [],
        } = this.blog;



        const translations = reduceTranslations(blogs_sections_translations as BlogSectionsTranslate[]);


        const result: Record<string, any> = {
            id,
            image: getUrl(this.req, "images", image),
        };

        if (this.options.includeTranslations) {
            result.ar = translations['ar'] || null;
            result.en = translations['en'] || null;
        } else {
            result.title = translations[this.lang].title ?? ''
            result.desc = translations[this.lang].desc ?? ''
        }


        return result;
    }

    static make(item: BlogSection, req: Request, options: ResourceOptions = {}) {
        return new BlogSectionResource(item, req, options).toJSON()
    }

    static collection(items: BlogSection[], req: Request, options: ResourceOptions = {}) {
        return {
            data: items.map(item => new BlogSectionResource(item, req, options).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map(item => new BlogSectionResource(item, req, options).toJSON()),
                    meta,
                };
            }
        };
    }

}
