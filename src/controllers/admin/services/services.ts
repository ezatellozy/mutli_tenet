import { Op } from "sequelize";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { AppError } from "../../../middleware/errorHandler";
import { Service, ServiceTranslate } from "../../../models/services/services";
import { Request, Response } from "express";
import { simpleServiceResponse } from "../../../response/web/services";




interface Content {
  name: string;
  title: string;
  desc?: string;
  slug?: string;
  sub_title?: string;
  sub_desc?: string;
  locale: string;
  type: string;
}

interface TranslatedContent extends Content {
  locale: string;
  service_id: number;
}

const validateContent = (
  content: Content,
  locale: string,

): string[] => {
  const errors: string[] = [];
  if (!content.name) errors.push(`Name is required ${locale}`);
  if (!content.slug) errors.push(`Slug is required ${locale}`);
  if (!content.title) errors.push(`Title is required  ${locale}`);
  return errors;
};

/**
* Build translation data for bulk operations.
*/
const buildTranslatedContents = (
  translations: Record<string, Content>,
  service_id: number,

): { data: TranslatedContent[]; errors: string[] } => {
  const data: TranslatedContent[] = [];
  const errors: string[] = [];
  (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
    const validationErrors = validateContent(content, locale);
    if (validationErrors.length) {
      errors.push(...validationErrors);
    } else {
      const translatedContent: TranslatedContent = {
        service_id,
        locale,
        type: content.type,
        name: content.name,
        title: content.title,
        ...(content.slug && { slug: content.slug }),
      };

      // Conditionally add optional fields
      if (content.sub_title) translatedContent.sub_title = content.sub_title;
      if (content.desc) translatedContent.desc = content.desc;
      if (content.sub_desc) translatedContent.sub_desc = content.sub_desc;

      data.push(translatedContent);
    }
  });

  return { data, errors };
};

/**
* Upsert translations for a given page.
*/
const upsertTranslations = async (
  service_id: number,
  translations: Record<string, Content>,
  transaction: any,


) => {
  const { data, errors } = buildTranslatedContents(translations, service_id);
  if (errors.length > 0) {
    throw new AppError(422, errors[0], errors);
  }

  for (const translation of data) {
    const slugExists = translation.slug ? await ServiceTranslate.findOne({
      where: {
        slug: translation.slug,
        locale: translation.locale,
        service_id: { [Op.ne]: service_id },
      },
      transaction,
    }) : null;

    if (slugExists) {
      throw new AppError(422, `Slug "${translation.slug}" is already in use for locale ${translation.locale}.`, []);
    }
    const existing = await ServiceTranslate.findOne({
      where: { service_id, locale: translation.locale },
      transaction,
    });

    if (existing) {
      const updateData: Partial<typeof translation> = {
        type: translation.type,
        title: translation.title,
        slug: translation.slug,
        name: translation.name,
      };
      if (translation.sub_title) updateData.sub_title = translation.sub_title;
      if (translation.desc) updateData.desc = translation.desc;
      if (translation.sub_desc) updateData.sub_desc = translation.sub_desc;
      await existing.update(updateData, { transaction });
    } else {
      await ServiceTranslate.create(translation, { transaction });
    }
  }
};



export const createService = async (
  req: Request,
  res: Response
): Promise<void> => {

  const { ar, en, icon, video, image, background, type } = req.body;
  const errors: string[] = [];
  if (!icon) errors.push('Icon is required')
  if (!type) errors.push('Type is required')
  if (errors.length > 0) {
    ResponseHandler.error(res, errors[0], 422, errors);
    return
  }


  try {
    const transaction = await sequelize.transaction();


    const serviceData = await Service.create({
      icon: icon,
      type: type,
      ...(video && { video: video }),
      ...(image && { image: image }),
      ...(background && { background: background }),


    }, {
      transaction
    });




    try {
      // Process translations
      await upsertTranslations(serviceData.id, { ar }, transaction);
      await upsertTranslations(serviceData.id, { en }, transaction);
      await transaction.commit()
    } catch (error) {

      await transaction.rollback();


      if (error instanceof Error) {

        ResponseHandler.error(
          res,
          error.message ?? "Failed to create Service",
          500
        );
      } else {

        ResponseHandler.error(res, "Failed to create Service", 500)
      }
      return;
    }


    // Bulk insert translations
    const translateData = await ServiceTranslate.findAll({
      where: { service_id: serviceData.id },
      attributes: ['title', 'desc', 'locale', 'sub_title', 'sub_desc', 'slug']
    });

    const translationsByLocale = translateData.reduce(
      (acc: { [key: string]: any }, translation) => {
        const { locale, ...rest } = translation.get();
        acc[locale] = rest;
        return acc;
      },
      {} as Record<string, (typeof translateData)[number]>
    );

    ResponseHandler.success(
      res,
      {
        ...serviceData.get(),
        ar: translationsByLocale["ar"] || null,
        en: translationsByLocale["en"] || null,
      },
      "Service created successfully"
    );
  } catch (error) {



    ResponseHandler.error(res, error instanceof Error ? error.message : "Unknown error", 422, [])
    return;
  }
};

export const updateService = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;

  try {
    const transaction = await sequelize.transaction();
    const { ar, en, icon, video, image, background, type } = req.body;
    const errors: string[] = [];
    const serviceData = await Service.findByPk(id);
    if (!serviceData) {
      ResponseHandler.error(res, "Service not found", 422, []);
      return;
    }
    if (!serviceData.icon) errors.push('Icon is required')
    if (!serviceData.type) errors.push('Type is required')
    if (errors.length > 0) {
      ResponseHandler.error(res, errors[0], 422, errors);
      return
    }
    await serviceData.update({
      ...(icon && { icon: icon }),
      ...(video && { video: video }),
      ...(image && { image: image }),
      ...(background && { background: background }),
      type
    }, {
      transaction
    });

    try {
      await upsertTranslations(serviceData.id, { ar }, transaction);
      await upsertTranslations(serviceData.id, { en }, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      ResponseHandler.error(res, err instanceof Error ? err.message : "Failed to update Service", 500, []);
      return;
    }



    const updatedTranslations = await ServiceTranslate.findAll({
      where: { service_id: id },
    });

    const translationsByLocale = updatedTranslations.reduce(
      (acc, translation) => {
        acc[translation.locale] = translation;
        return acc;
      },
      {} as Record<string, (typeof updatedTranslations)[number]>
    );

    res.status(200).json({
      message: "Service updated successfully",
      data: {
        ...serviceData.get(),
        ar: translationsByLocale["ar"] || null,
        en: translationsByLocale["en"] || null,
      },
    });

  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });

  }
};

export const deleteService = async (
  req: Request,
  res: Response
): Promise<void> => {
  const service = await Service.findByPk(req.params.id);
  if (!service) {
    ResponseHandler.error(res, "Service not found", 422, []);
    return;
  }

  await service
    .destroy()
    .then(() =>
      ResponseHandler.success(res, "Service deleted successfully")

    )
    .catch((error) => res.status(500).json(error.message));
};
const getSrcUrl = (req: Request, src: string, type: string) => src
  ? `${req.protocol}://${req.get(
    "host"
  )}/${type}/services/${src.replace(/\\/g, "/")}`
  : null;

export const getServiceById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sId = req.params.id;
    const lang = req.headers["accept-language"] ?? 'en';

    const service = await Service.findByPk(sId, {
      include: [
        {
          model: ServiceTranslate,
          attributes: ["title", "desc", 'sub_title', 'sub_desc', 'slug', "locale", "name"],
          required: false,
        },
      ],
      attributes: ["id", "icon", 'image', 'video', 'background', "type"],
    });

    if (!service) {
      ResponseHandler.error(res, "Service not found", 422, []);
      return;
    }

    const resService = service.get();
    // const translation = service.service_translations?.[0].get() || {};
    let translateData = []

    if (service.service_translations.length > 0) {
      translateData = service.service_translations.map((t: any) => t.get())
    }




    const translation = translateData.reduce((acc, t) => {

      const { locale, ...rest } = t
      acc[locale] = rest

      return acc;
    }, {} as Record<string, (typeof service.service_translations)[number]>) || {
      ar: null,
      en: null,

    };



    // const { id, ...filterdTrans } = translation
    const response = {
      id: resService.id,
      type: resService.type,
      icon: getSrcUrl(req, resService.icon, 'images'),
      image: getSrcUrl(req, resService.image, 'images'),
      background: getSrcUrl(req, resService.background, 'images'),
      video: getSrcUrl(req, resService.video, 'files'),
      title: translation[lang] ? translation[lang].title : null,
      sub_title: translation[lang] ? translation[lang].sub_title : null,
      desc: translation[lang] ? translation[lang].desc : null,
      sub_desc: translation[lang] ? translation[lang].sub_desc : null,
      slug: translation[lang] ? translation[lang].slug : null,
      ...translation,
    };

    ResponseHandler.success(res, response)

  } catch (err) {
    if (err instanceof Error) {
      ResponseHandler.error(
        res,
        err.message ?? "Failed to fetch service",
        500,
        []
      );

    } else {
      ResponseHandler.error(
        res,
        "Failed to fetch service",
        500,
        []
      );
    }
  }
};



export const getIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = req.headers["Accept-Language"] ?? "en";

    const services = await Service.findAll({
      include: [
        {
          model: ServiceTranslate,
          where: { locale: lang },
          attributes: ["title", "desc", 'slug'],
          required: false,
        },
      ],
      attributes: ["id", "icon", 'image', 'video', 'background'],
    });

    if (!services) {
      ResponseHandler.error(res, "Service not found", 422, []);
      return;
    }

    const servcesRes = services.map((service) => {
      const resService = service.get();



      const translation = service.service_translations?.[0].get() || {
        ar: null,
        en: null,
      };

      const { id, ...filterdTranslations } = translation

      return {
        id: resService.id,

        icon: getSrcUrl(req, resService.icon, 'images'),
        image: getSrcUrl(req, resService.image, 'images'),
        background: getSrcUrl(req, resService.background, 'images'),
        video: getSrcUrl(req, resService.video, 'files'),

        ...filterdTranslations,
      };
    });

    ResponseHandler.success(res, servcesRes);
  } catch (err) {
    ResponseHandler.error(res, "Failed to fetch servces", 422, []);
  }
};


export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  try {
    const services = await Service.findAll({
      include: [
        {
          model: ServiceTranslate,
          where: { locale: req.headers["accept-language"] ?? 'en' },
          attributes: ['name', 'slug'],
        },
      ],
    });

    if (!services || services.length === 0) {
      ResponseHandler.error(res, "No services found", 404);
      return;
    }

    // Return the list of all services
    ResponseHandler.success(res, simpleServiceResponse(req, services));
  } catch (error) {
    // Handle unexpected errors
    console.error(error);
    ResponseHandler.error(res, "An error occurred while fetching the services", 500);
  }
};
