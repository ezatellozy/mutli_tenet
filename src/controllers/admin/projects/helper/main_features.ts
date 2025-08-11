
import { AppError } from "../../../../middleware/errorHandler";
import { ProjectImage, ProjectMainFeatureTrans } from "../../../../models/projects/project_main_features";
import { ProjectTrans } from "../../../../models/projects/project";


interface Content {
    locale: string
    project_id: number
    main_feature_title: string
    main_feature_desc: string

}
interface FeatureContent {
    locale: string
    project_main_feature_id: number
    name: string

}


const validateProjectTrans = (translation: Content, locale: string): string[] => {
    const errors: string[] = []
    if (!translation.main_feature_title) errors.push(`${locale} Main feature title is required`)
    if (!translation.main_feature_desc) errors.push(`${locale} Main feature desc is required`)
    return errors

}
const validateFeatureTrans = (translation: FeatureContent, locale: string): string[] => {
    const errors: string[] = []
    if (!translation.name) errors.push(`${locale} name is required`)
    return errors
}


const buildProjectTrans = (translations: Record<string, Content>, project_id: number): { data: Content[], errors: string[] } => {
    const data: Content[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
        const validationErrors = validateProjectTrans(content, locale)
        if (validationErrors.length) {
            errors.push(...validationErrors)
        } else {
            data.push({
                locale,
                project_id,
                main_feature_title: content.main_feature_title,
                main_feature_desc: content.main_feature_desc

            })
        }
    })
    return { data, errors }
}

const upsertProjectTrans = async (project_id: number, translations: Record<string, Content>, transaction: any) => {
    const { data, errors } = buildProjectTrans(translations, project_id)
    if (errors.length) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {

        const existing = await ProjectTrans.findOne({
            where: { project_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            await existing.update(translation, { transaction })
        }
    }
}
const buildMainFeatureTrans = (translations: Record<string, FeatureContent>, project_main_feature_id: number): { data: FeatureContent[], errors: string[] } => {
    const data: FeatureContent[] = [];
    const errors: string[] = [];
    (<any>Object).entries(translations).forEach(([locale, content]: [string, FeatureContent]) => {
        const validationErrors = validateFeatureTrans(content, locale)
        if (validationErrors.length) {
            errors.push(...validationErrors)
        } else {
            data.push({
                locale,
                project_main_feature_id,
                name: content.name,
            })
        }
    })
    return { data, errors }
}

const upsertMainProjectTrans = async (project_main_feature_id: number, translations: Record<string, FeatureContent>, transaction: any) => {
    const { data, errors } = buildMainFeatureTrans(translations, project_main_feature_id)
    if (errors.length) {
        throw new AppError(422, errors[0], errors);
    }
    for (const translation of data) {

        const existing = await ProjectMainFeatureTrans.findOne({
            where: { project_main_feature_id, locale: translation.locale },
            transaction,
        });
        if (existing) {
            await existing.update(translation, { transaction })
        } else {
            await ProjectMainFeatureTrans.create(translation, { transaction })
        }
    }
}

const upsertImages = async (project_id: number, images: { id: number; media: string }[], transaction: any) => {

    if (!images) return;

    for (const image of images) {
        const newImage: { image: string; project_id: number }[] = [];

        if (image.id) {
            const existing = await ProjectImage.findByPk(image.id, { transaction });
            if (existing) {
                await existing.update({ image: image.media }, { transaction });
            } else {
                newImage.push({ image: image.media, project_id });
            }
        } else {
            newImage.push({ image: image.media, project_id });
        }

        if (newImage.length > 0) {
            await ProjectImage.bulkCreate(newImage, { transaction });
        }
    }
};



export { upsertProjectTrans, upsertMainProjectTrans, upsertImages };

