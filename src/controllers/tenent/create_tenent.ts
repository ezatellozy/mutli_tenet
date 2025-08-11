import { Request, Response } from "express";
import sequelize from "../../../utils/database";
import { ResponseHandler } from "../../../utils/responseHandler";
import { AppError } from "../../middleware/errorHandler";
import { Tenent } from "../../models/tenant";
import { Op } from "sequelize";

type Content = {
  title: string;
  content: string;
  video?: string;
  button_name: string;
};

interface TranslatedContent extends Content {
  page_id: number;
  locale: string;
}

export const createTenent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { name, password, email, phone, image } = req.body;

  const errors: string[] = [];

  if (errors.length) {
    ResponseHandler.error(res, "Validation errors", 422, errors);
    return;
  }

  try {
    const transaction = await sequelize.transaction();
    // let page: Page;
    // try {
    //     const currentPage = await Page.findOne({
    //         where: { type },
    //         order: [["id", "DESC"]],
    //     });

    //     if (currentPage) {
    //         page = currentPage;
    //         if (video) {

    //             await page.update({ video }, { transaction });
    //         }
    //     } else {
    //         if (!video && type === "middle_intro") {
    //             ResponseHandler.error(res, "video is required", 422);
    //             return;
    //         }
    //         page = await Page.create({ video, type } as Page, { transaction });
    //     }

    //     await upsertTranslations(page.id, { ar }, transaction, type);
    //     await upsertTranslations(page.id, { en }, transaction, type);

    //     await transaction.commit();
    // } catch (err) {
    //     await transaction.rollback();

    //     if (err instanceof Error) {

    //         ResponseHandler.error(
    //             res,
    //             err.message ?? "Failed to create page",
    //             500,
    //             []
    //         );
    //     } else {
    //         ResponseHandler.error(
    //             res,
    //             "Failed to create page",
    //             500,
    //             []
    //         );
    //     }

    //     return;
    // }

    // const translateData = await PageTranslations.findAll({
    //     where: {
    //         page_id: page.id,
    //     },
    //     attributes: ['title', 'locale', 'content', 'button_name']
    // });
    // const translateDataByLocale = translateData.reduce((acc, translation) => {
    //     acc[translation.locale] = translation;
    //     return acc;
    // }, {} as Record<string, (typeof translateData)[number]>);

    // const videoUrl = page.video
    //     ? `${req.protocol}://${req.get(
    //         "host"
    //     )}/files/pages/${page.video.replace(/\\/g, "/")}`
    //     : null;
    // // const imageUrl = page.image
    // //     ? `${req.protocol}://${req.get(
    // //         "host"
    // //     )}/files/images/${page.image.replace(/\\/g, "/")}`
    // //     : null;

    // const response = {
    //     ...(page.type === 'middle_intro' && { video: videoUrl }),
    //     type: page.type,
    //     ar: translateDataByLocale["ar"] || null,
    //     en: translateDataByLocale["en"] || null,
    // };

    // ResponseHandler.success(res, response);
  } catch (error) {
    if (error instanceof Error) {
      ResponseHandler.error(res, error?.message ?? "Failed to add page", 500);
    } else {
      ResponseHandler.error(res, "Failed to add page", 500);
    }
  }
};

// export const getHomeIntro = async (req: Request, res: Response): Promise<void> => {
//     const { type } = req.query as { type: string }

//     if (!type) {
//         ResponseHandler.error(res, 'type is requred', 422)
//         return
//     }
//     const allowedTypes = ["top_intro", "middle_intro"];

//     if (!allowedTypes.includes(type)) {
//         ResponseHandler.error(res, "Type is not supported", 422, []);
//         return;
//     }

//     try {

//         const home_page = await Page.findOne({
//             where: {
//                 type: type
//             },
//             include: [
//                 {
//                     model: PageTranslations,

//                     required: false,
//                     attributes: ["locale", "title", "content", "name", "button_name"]
//                 }
//             ],
//             attributes: ["image", "type", "video"]
//         })

//         if (!home_page) {

//             ResponseHandler.success(res, null)
//             return
//         }

//         let translateData = []

//         if (home_page.PageTranslations.length > 0) {
//             translateData = home_page.PageTranslations.map((t: any) => t.get())
//         }

//         const translation = translateData.reduce((acc, t) => {

//             const { locale, ...rest } = t
//             acc[locale] = rest

//             return acc;
//         }, {} as Record<string, (typeof home_page.PageTranslations)[number]>) || {
//             ar: null,
//             en: null,

//         };

//         const resPage = home_page.get();
//         const imageUrl = resPage.image
//             ? `${req.protocol}://${req.get(
//                 "host"
//             )}/images/pages/${resPage.image.replace(/\\/g, "/")}`
//             : null;
//         const videoUrl = resPage.video
//             ? `${req.protocol}://${req.get(
//                 "host"
//             )}/files/pages/${resPage.video.replace(/\\/g, "/")}`
//             : null;

//         const response = {

//             video: videoUrl,
//             image: imageUrl,
//             type: resPage.type,

//             ...translation,
//         };
//         ResponseHandler.success(res, response);

//     } catch (error) {
//         if (error instanceof Error) {

//             ResponseHandler.error(res, error?.message || "Failed to fetch pages", 500, []);
//         } else {
//             ResponseHandler.error(res, "Failed to fetch pages", 500, []);

//         }
//     }
// }
