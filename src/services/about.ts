import { About, AboutTranslate } from "../models/about_us";


export const getAll = async () => {
    return await About.findAll({
        attributes: ['image', 'video', 'id'],
        include: [
            {
                model: AboutTranslate,
                attributes: ['title', 'desc']
            }
        ]
    })
}
export const getAbout = async () => {
    return await About.findOne({
        attributes: ['image', 'video', 'id'],
        include: [
            {
                model: AboutTranslate,
                attributes: ['title', 'desc', 'locale']
            }
        ]
    })
}

