import { Request } from "express";
import { ServiceSections, ServiceSectionsTranslation } from "../../models/service_sections/sections";
import { SectionFeatureResource } from "./SectionFeatureResource";

const getUrl = (req: Request, type: string, media: string | null): string | null =>
    media ? `${req.protocol}://${req.get("host")}/${type}/service_sections/${media.replace(/\\/g, "/")}` : null;

const reduceTranslations = <T extends { locale: string }>(
    items: T[]
): Record<string, Omit<T, 'locale'>> =>
    items.reduce((acc, { locale, ...rest }) => {
        acc[locale] = rest;
        return acc;
    }, {} as Record<string, Omit<T, 'locale'>>);

interface ResourceOptions {
    includeFeatures?: boolean;
    includeTranslations?: boolean;
}

export class ServiceSectionResource {
    private section: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string

    constructor(section: ServiceSections, req: Request, options: ResourceOptions = {}, lang: string) {
        this.section = section.get ? section.get({ plain: true }) : section;
        this.req = req;
        this.lang = lang;
        this.options = {
            includeFeatures: true,
            includeTranslations: true,
            ...options,
        };
    }

    toJSON() {
        const {
            id,
            type,
            image,
            video,
            background,
            service_section_translations = [],
            section_features = []
        } = this.section;

        const translations = reduceTranslations(service_section_translations as ServiceSectionsTranslation[]);
        const result: Record<string, any> = {
            id,
            type,
            image: getUrl(this.req, "images", image),
            video: getUrl(this.req, "files", video),
            title: translations[this.lang].title ?? '',
            desc: translations[this.lang].desc ?? '',
            background: getUrl(this.req, "images", background),
        };

        if (this.options.includeTranslations) {

            result.ar = translations['ar'] || null;
            result.en = translations['en'] || null;
        }

        if (this.options.includeFeatures) {
            result.features = SectionFeatureResource.collection(section_features, this.req, this.options, this.lang);
        }

        return result;
    }

    static make(item: ServiceSections, req: Request, options: ResourceOptions = {}, lang: string) {
        return new ServiceSectionResource(item, req, options, lang).toJSON()
    }

    static collection(items: ServiceSections[], req: Request, options: ResourceOptions = {}, lang: string) {
        return {
            data: items.map(item => new ServiceSectionResource(item, req, options, lang).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map(item => new ServiceSectionResource(item, req, options, lang).toJSON()),
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
        lang: string
    ) {
        const total = paginatedResult.count;
        const lastPage = Math.ceil(total / perPage);

        return {
            data: paginatedResult.rows.map(item => new ServiceSectionResource(item, req, options, lang).toJSON()),
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
