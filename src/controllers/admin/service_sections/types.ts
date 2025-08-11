export interface FeatureType {
    id?: number,
    icon: string,
    ar: {
        title: string,
        desc?: string,
    },
    en: {
        title: string,
        desc?: string,
    },
}

export interface FeatureContent {
    title: string,
    desc: string,
}

export interface Content {
    title: string;
    desc?: string;
}

export interface TranslatedSectionContent extends Content {
    locale: string;
    service_section_id: number;

}
export interface TranslatedFeatureContent extends Content {
    locale: string;
    feature_id: number;
}