import { Feature, FeatureTranslation } from "../../models/features";
import { Request } from "express";

const getUrl = (req: Request, media: string): string | null =>
    media ? `${req.protocol}://${req.get("host")}/images/features/${media.replace(/\\/g, "/")}` : null;


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


export class FeatureResource {
    private feature: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string



    constructor(feature: Feature, req: Request, options: ResourceOptions = {
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
            image: getUrl(this.req, this.feature.image),
        }

        const translations = reduceTranslations(this.feature.FeatureTranslations as FeatureTranslation[]);
        if (this.options.includeTranslations) {
            data.ar = translations['ar'] || null;
            data.en = translations['en'] || null;
        } else {
            data.name = translations[this.lang]?.name || "";
            data.desc = translations[this.lang]?.desc || "";
        }


        return data;
    }

    static async make(feature: Feature, req: Request, options: ResourceOptions = {}) {
        return new FeatureResource(feature, req, options).toJSON();
    }

    static async collection(features: Feature[], req: Request, options: ResourceOptions = {}) {
        return await Promise.all(features.map(async (feature) => {
            return await FeatureResource.make(feature, req, options);
        }));
    }



}
