import { Request } from "express";
import { SectionFeature, SectionFeatureTranslation } from "../../models/service_sections/sectionFeatures";
const getUrl = (req: Request, media: string): string | null =>
    media ? `${req.protocol}://${req.get("host")}/images/section_features/${media.replace(/\\/g, "/")}` : null;

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

export class SectionFeatureResource {
    private feature: any;
    private req: Request;
    private options: ResourceOptions;
    private lang: string;

    constructor(feature: SectionFeature, req: Request, options: ResourceOptions = {}, lang: string) {
        this.feature = feature.get ? feature.get({ plain: true }) : feature;
        this.req = req;
        this.lang = lang;
        this.options = {
            includeFeatures: true,
            includeTranslations: true,
            ...options,
        };
    }

    toJSON() {
        const { id, icon, section_feature_translations = [] } = this.feature;
        const translations = reduceTranslations(section_feature_translations as SectionFeatureTranslation[]);

        const result = {
            id,
            icon: getUrl(this.req, icon),
            title: translations[this.lang].title,
            desc: translations[this.lang].desc,
        }

        if (this.options.includeTranslations) {
            Object.assign(result, translations);
        }

        return result;
    }

    static collection(items: any[], req: Request, options: ResourceOptions = {}, lang: string) {
        return (items || []).map(item => new SectionFeatureResource(item, req, options, lang).toJSON());
    }
}
