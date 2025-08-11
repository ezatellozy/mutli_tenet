import { Request } from "express";
import { About, AboutTranslate } from "../../../models/about_us/index";

const getUrl = (req: Request, type: string, media: string | null): string | null =>
    media ? `${req.protocol}://${req.get("host")}/${type}/about/${media.replace(/\\/g, "/")}` : null;

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

export class AboutResource {
    private about: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string

    constructor(about: About, req: Request, options: ResourceOptions = {}) {
        this.about = about.get ? about.get({ plain: true }) : about;
        this.req = req;
        this.lang = req.headers['accept-language'] ?? 'en';
        this.options = {
            includeTranslations: false,
            ...options,
        };
    }

    toJSON() {
        const {
            id,
            video,
            image,
            about_translations = [],
        } = this.about;



        const translations = reduceTranslations(about_translations as AboutTranslate[]);

        const result: Record<string, any> = {
            id,

            image: getUrl(this.req, "images", image),
            video: getUrl(this.req, "files", video),

        };

        if (this.options.includeTranslations) {
            result.ar = translations['ar'] || null;
            result.en = translations['en'] || null;
        } else {
            Object.assign(result, {
                title: translations[this.lang]?.title ?? '',
                desc: translations[this.lang]?.desc ?? '',

            })
        }

        return result;
    }

    static make(item: About, req: Request, options: ResourceOptions = {}) {
        return new AboutResource(item, req, options).toJSON()
    }

    static collection(items: About[], req: Request, options: ResourceOptions = {}) {
        return {
            data: items.map(item => new AboutResource(item, req, options).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map(item => new AboutResource(item, req, options).toJSON()),
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
            data: paginatedResult.rows.map(item => new AboutResource(item, req, options).toJSON()),
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
