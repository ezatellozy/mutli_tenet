import { Request } from "express";
import { HomeService } from "../../models/services/home_services";
import { Service } from "../../models/services/services";
import { ServiceSectionResource } from "../admin/ServiceSectionResource";

const getUrl = (req: Request, type: string, media: string) =>
    media
        ? `${req.protocol}://${req.get("host")}/${type}/services/${media.replace(
            /\\/g,
            "/"
        )}`
        : null;

export const simpleServiceResponse = (req: Request, services: Service[]) => {
    const res = services.map((service) => ({
        id: service.id,
        icon: getUrl(req, "images", service.icon),
        name: service.service_translations[0]?.name || "",
        slug: service.service_translations[0]?.slug || "",
    }));
    return res;
};

export class ServiceResource {
    private service: any;
    private req: Request;
    private lang: string;

    constructor(service: Service, req: Request, lang: string) {
        this.service = service.get ? service.get({ plain: true }) : service;
        this.req = req;
        this.lang = lang;
    }

    toJSON() {
        const {
            image,
            video,
            type,
            icon,
            background,
            id,
            service_translations,

            service_sections = [],
        } = this.service;

        const sections = ServiceSectionResource.collection(
            service_sections,
            this.req,
            {
                includeFeatures: true,
                includeTranslations: false,
            },
            this.lang
        );

        const result: Record<string, any> = {
            image: getUrl(this.req, "images", image),
            video: getUrl(this.req, "files", video),
            icon: getUrl(this.req, "images", icon),
            background: getUrl(this.req, "images", background),
            type,
            id,
            name: service_translations[0]?.name || "",
            title: service_translations[0].title || "",
            desc: service_translations[0].desc || "",
            sub_title: service_translations[0].sub_title || "",
            sub_desc: service_translations[0].sub_desc || "",
            slug: service_translations[0].slug || "",
            sections: sections.data,
        };

        return result;
    }

    static make(item: Service, req: Request, lang: string) {
        return new ServiceResource(item, req, lang).toJSON();
    }

    static collection(items: Service[], req: Request, lang: string) {
        return {
            data: items.map((item) => new ServiceResource(item, req, lang).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map((item) =>
                        new ServiceResource(item, req, lang).toJSON()
                    ),
                    meta,
                };
            },
        };
    }

    static collectionWithPagination(
        paginatedResult: {
            rows: any[];
            count: number;
        },
        req: Request,
        currentPage: number,
        perPage: number,
        lang: string
    ) {
        const total = paginatedResult.count;
        const lastPage = Math.ceil(total / perPage);

        return {
            data: paginatedResult.rows.map((item) =>
                new ServiceResource(item, req, lang).toJSON()
            ),
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
            },
        };
    }
}
export class SimpleServiceResource {
    private service: any;
    private req: Request;


    constructor(service: Service, req: Request) {
        this.service = service.get ? service.get({ plain: true }) : service;
        this.req = req;

    }

    toJSON() {
        const { icon, id, service_translations } = this.service;

        const result: Record<string, any> = {
            icon: getUrl(this.req, "images", icon),
            id,
            name: service_translations[0]?.name || "",
            slug: service_translations[0].slug || "",
        };

        return result;
    }

    static make(item: Service, req: Request) {
        return new SimpleServiceResource(item, req).toJSON();
    }

    static collection(items: Service[], req: Request) {
        return {
            data: items.map((item) => new SimpleServiceResource(item, req).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map((item) =>
                        new SimpleServiceResource(item, req).toJSON()
                    ),
                    meta,
                };
            },
        };
    }

    static collectionWithPagination(
        paginatedResult: {
            rows: any[];
            count: number;
        },
        req: Request,
        currentPage: number,
        perPage: number,

    ) {
        const total = paginatedResult.count;
        const lastPage = Math.ceil(total / perPage);

        return {
            data: paginatedResult.rows.map((item) =>
                new SimpleServiceResource(item, req).toJSON()
            ),
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
            },
        };
    }
}
export class HomeServiceResource {
    private service: any;
    private req: Request;


    constructor(service: HomeService, req: Request) {
        this.service = service.get ? service.get({ plain: true }) : service;
        this.req = req;

    }


    toJSON() {
        const { id, service, icon, color, HomeServiceTranslations } = this.service;
        const result: Record<string, any> = {
            icon: getUrl(this.req, "images", icon),
            color,
            id,
            title: HomeServiceTranslations[0]?.title || "",
            desc: HomeServiceTranslations[0].desc || "",
            service_slug: service ? service.service_translations[0]?.slug || null : null
        };

        return result;
    }

    static make(item: HomeService, req: Request) {
        return new HomeServiceResource(item, req).toJSON();
    }

    static collection(items: HomeService[], req: Request) {
        return {
            data: items.map((item) => new HomeServiceResource(item, req).toJSON()),
            withMeta(meta: Record<string, any>) {
                return {
                    data: items.map((item) =>
                        new HomeServiceResource(item, req).toJSON()
                    ),
                    meta,
                };
            },
        };
    }

    static collectionWithPagination(
        paginatedResult: {
            rows: any[];
            count: number;
        },
        req: Request,
        currentPage: number,
        perPage: number,

    ) {
        const total = paginatedResult.count;
        const lastPage = Math.ceil(total / perPage);

        return {
            data: paginatedResult.rows.map((item) =>
                new HomeServiceResource(item, req).toJSON()
            ),
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
            },
        };
    }
}
