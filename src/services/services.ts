
import { About, AboutTranslate } from "../models/about_us";


export const getIndex = async () => {
    return await About.findAll({
        include: [
            {
                model: AboutTranslate,
                attributes: ["title", "desc", "locale"],
            },
        ],
        attributes: ["id", "video", "image"],
    })
}
export const getIndexWithPaginate = async () => {
    return About.findAndCountAll({
        include: [
            {
                model: AboutTranslate,
                attributes: ["title", "desc", "locale"],
            },
        ],
        attributes: ["id", "video", "image"],
    })
}


export const getAboutById = async (id: number) => {
    return await About.findByPk(id, {
        include: [
            {
                model: AboutTranslate,
                attributes: ["title", "desc", "locale"],
            },
        ],
        attributes: ["id", "video", "image"],
    });
}
