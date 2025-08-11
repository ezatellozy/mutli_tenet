import { Request } from "express";
import { Project, ProjectTrans } from "../../models/projects/project";

import { FeatureResource } from "../features";
import { MainFeatureResource, ProjectFeatureResource, ProjectImagesResource } from "./features";
import { ProjectImage } from "../../models/projects/project_main_features";

const getUrl = (
    req: Request,
    media: string,
    mediaType: string
): string | null =>
    media
        ? `${req.protocol}://${req.get(
            "host"
        )}/${mediaType}/projects/${media.replace(/\\/g, "/")}`
        : null;

const reduceTranslations = <T extends { locale: string }>(
    translations: T[]
): Record<string, Omit<T, "locale">> => {
    return translations.reduce((acc, { locale, ...rest }) => {
        acc[locale] = rest;
        return acc;
    }, {} as Record<string, Omit<T, "locale">>);
};

interface ResourceOptions {
    includeTranslations?: boolean;
    includeTools?: boolean;
}

export class ProjectResource {
    private project: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string;

    constructor(
        project: Project,
        req: Request,
        options: ResourceOptions = {
            includeTranslations: true,
            includeTools: true,
        }
    ) {
        this.project = project.get ? project.get({ plain: true }) : project;
        this.req = req;
        this.options = options;
        this.lang = req.headers["accept-language"] ?? "en";
    }

    async toJSON() {

        const translations = reduceTranslations(
            this.project.project_translations as ProjectTrans[]
        );

        const data: any = {
            id: this.project.id,
            image: this.project.image
                ? getUrl(this.req, this.project.image, "images")
                : null,
            about_media: this.project.about_media
                ? getUrl(
                    this.req,
                    this.project.about_media,
                    this.project.about_media_type === "image" ? "images" : "files"
                )
                : null,
            about_media_type: this.project.about_media_type,
            downloads: this.project.downloads,
            rating: this.project.rating,
            founded_in: this.project.founded_in,
        };

        if (this.options.includeTranslations) {
            data.ar = translations["ar"] || null;
            data.en = translations["en"] || null;
        } else {
            data.name = translations[this.lang]?.name || "";
            data.desc = translations[this.lang]?.desc || "";
            data.platform = translations[this.lang]?.platform || "";
            data.about_title = translations[this.lang]?.about_title || "";
            data.about_desc = translations[this.lang]?.about_desc || "";
            data.feature_title = translations[this.lang]?.feature_title || "";
            data.feature_desc = translations[this.lang]?.feature_desc || "";
            data.main_feature_title =
                translations[this.lang]?.main_feature_title || "";
            data.main_feature_desc = translations[this.lang]?.main_feature_desc || "";
            data.slug = translations[this.lang]?.slug || "";
            data.location = translations[this.lang]?.location || "";
        }

        if (this.options.includeTools) {
            data.tools = await FeatureResource.collection(
                this.project.Features,
                this.req,
                {}
            );
        }


        return data;
    }

    static async make(
        project: Project,
        req: Request,
        options: ResourceOptions = {
            includeTranslations: true,
            includeTools: true,
        }
    ) {
        return await new ProjectResource(project, req, options).toJSON();
    }

    static async collection(
        projects: Project[],
        req: Request,
        options: ResourceOptions = {}
    ) {
        return await Promise.all(
            projects.map((project) =>
                new ProjectResource(project, req, options).toJSON()
            )
        );
    }

    static async collectionWithPagination(
        paginatedResult: {
            rows: any[];
            count: number;
        },
        req: Request,
        options: ResourceOptions = {},
        currentPage: number,
        perPage: number
    ) {
        const total = paginatedResult.count;
        const lastPage = Math.ceil(total / perPage);

        return {
            data: await Promise.all(
                paginatedResult.rows.map((item) =>
                    new ProjectResource(item, req, options).toJSON()
                )
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
