
import { ProjectImage, ProjectMainFeature, ProjectMainFeatureTrans } from "../../models/projects/project_main_features";
import { ProjectFeature, ProjectFeatureTrans } from "../../models/projects/project_features";
import { Request } from "express";

const getUrl = (req: Request, media: string): string | null =>
    media ? `${req.protocol}://${req.get("host")}/images/projects/${media.replace(/\\/g, "/")}` : null;


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

export class MainFeatureResource {
    private feature: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string



    constructor(feature: ProjectMainFeature, req: Request, options: ResourceOptions = {
        includeTranslations: true
    }) {
        this.feature = feature.get ? feature.get({ plain: true }) : feature;
        this.req = req;
        this.options = options;
        this.lang = req.headers['accept-language'] ?? 'en';
    }

    async toJSON() {

        const data: any = {
            id: this.feature.id,
            icon: getUrl(this.req, this.feature.icon),
        }

        const translations = reduceTranslations(this.feature.project_main_feature_translations as ProjectMainFeatureTrans[]);
        if (this.options.includeTranslations) {
            data.ar = translations['ar'] || null;
            data.en = translations['en'] || null;
        } else {
            data.name = translations[this.lang]?.name || "";
        }


        return data;
    }

    static async make(feature: ProjectMainFeature, req: Request, options: ResourceOptions = {}) {
        return new MainFeatureResource(feature, req, options).toJSON();
    }

    static async collection(features: ProjectMainFeature[], req: Request, options: ResourceOptions = {}) {
        return await Promise.all(features.map(async (feature) => {
            return await MainFeatureResource.make(feature, req, options);
        }));
    }
}

export class ProjectFeatureResource {
    private feature: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string

    constructor(feature: ProjectFeature, req: Request, options: ResourceOptions = {
        includeTranslations: true
    }) {
        this.feature = feature.get ? feature.get({ plain: true }) : feature;
        this.req = req;
        this.options = options;
        this.lang = req.headers['accept-language'] ?? 'en';
    }

    async toJSON() {

        const data: any = {
            id: this.feature.id,
            icon: getUrl(this.req, this.feature.icon),
        }

        const translations = reduceTranslations(this.feature.project_feature_translations as ProjectFeatureTrans[]);
        if (this.options.includeTranslations) {
            data.ar = translations['ar'] || null;
            data.en = translations['en'] || null;
        } else {
            data.name = translations[this.lang]?.name || "";
        }


        return data;
    }

    static async make(feature: ProjectFeature, req: Request, options: ResourceOptions = {}) {
        return new ProjectFeatureResource(feature, req, options).toJSON();
    }

    static async collection(features: ProjectFeature[], req: Request, options: ResourceOptions = {}) {
        return await Promise.all(features.map(async (feature) => {
            return await ProjectFeatureResource.make(feature, req, options);
        }));
    }



}
export class ProjectImagesResource {
    private feature: any;
    private req: Request;


    constructor(feature: ProjectImage, req: Request) {
        this.feature = feature.get ? feature.get({ plain: true }) : feature;
        this.req = req;

    }

    async toJSON() {
        const data: any = {
            id: this.feature.id,
            image: getUrl(this.req, this.feature.image),
        }
        return data;
    }

    static async make(feature: ProjectImage, req: Request,) {
        return new ProjectImagesResource(feature, req).toJSON();
    }

    static async collection(features: ProjectImage[], req: Request) {
        return await Promise.all(features.map(async (feature) => {
            return await ProjectImagesResource.make(feature, req);
        }));
    }
}