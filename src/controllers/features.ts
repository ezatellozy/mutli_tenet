import { ResponseHandler } from "../../utils/responseHandler";
import { AppError } from "../middleware/errorHandler";
import { Feature, FeatureTranslation } from "../models/features";
import { Request, Response } from "express";
import sequelize from "../../utils/database";


interface Content {
  name: string;
  desc: string;
}

interface TranslationContent extends Content {
  locale: string;
  feature_id: number;
}

/**
 * Validate a single translation content.
 */
const validateContent = (
  content: Content,
  locale: string,
  type: string
): string[] => {
  const errors: string[] = [];
  if (!content.name) errors.push(`name is required ${locale}`);
  if (!content.desc && type === 'features') errors.push(`desc is required ${locale}`);
  return errors;
};


const buildTranslatedContents = (
  translations: Record<string, Content>,
  feature_id: number,
  type: string,

) => {
  const data: TranslationContent[] = [];
  const errors: string[] = [];

  (<any>Object).entries(translations).forEach(([locale, content]: [string, Content]) => {
    const { name, desc } = content as Content;
    const validateError = validateContent(content, locale, type)
    if (validateError.length > 0) {
      errors.push(...validateError)
    } else {

      data.push({
        locale,
        feature_id,
        name,
        desc
      });
    }
  });
  return { data, errors };
};

const upsertTranslations = async (
  feature_id: number,
  translations: Record<string, Content>,
  transaction: any,
  type: string,

) => {
  const { data, errors } = buildTranslatedContents(translations, feature_id, type);
  if (errors.length > 0) {
    throw new AppError(422, errors[0], errors);
  }

  for (const translation of data) {
    const existing = await FeatureTranslation.findOne({
      where: { feature_id, locale: translation.locale },
      transaction,
    });

    if (existing) {

      await existing.update(
        {
          name: translation.name,
          desc: translation.desc,
        },
        { transaction }
      );
    } else {
      await FeatureTranslation.create(translation, { transaction });
    }
  }
};

const featureResposne = async (res: Response, req: Request, feature: Feature) => {

  const translateData = await FeatureTranslation.findAll({
    where: {
      feature_id: feature.id,
    },
    attributes: ['name', 'locale', 'desc']
  });
  const translateDataByLocale = translateData.reduce((acc: { [key: string]: any }, translation) => {
    const { locale, ...rest } = translation.get();
    acc[locale] = rest;

    return acc;
  }, {} as Record<string, (typeof translateData)[number]>);


  const imageUrl = feature.image
    ? `${req.protocol}://${req.get(
      "host"
    )}/images/features/${feature.image.replace(/\\/g, "/")}`
    : null;


  const response = {
    image: imageUrl,
    type: feature.type,
    ar: translateDataByLocale["ar"] || null,
    en: translateDataByLocale["en"] || null,
  };

  ResponseHandler.success(res, response);

}

export const createFeature = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { image, ar, en, type } = req.body;
  const errors: string[] = [];
  const allowedTypes = ["features", "partners", "technology"];

  if (!allowedTypes.includes(type)) {
    ResponseHandler.error(res, "Type is not supported", 422, []);
    return;
  }

  if (!ar || typeof ar !== "object") {
    ResponseHandler.error(res, "Content (ar)", 422, []);
    return;
  }
  if (!en || typeof en !== "object") {
    ResponseHandler.error(res, "Content (en)", 422, []);
    return;
  }

  if (!image) errors.push("image is required")
  if (!type) errors.push("Type is required")



  const arLocales = Object.keys(ar);
  const enLocales = Object.keys(en);
  if (arLocales.length !== enLocales.length) {
    errors.push(
      "Arabic and English content must have the same number of locales"
    );
  }

  arLocales.forEach((locale) => {
    if (!en[locale]) {
      errors.push(`Missing English content for locale: ${locale}`);
    }
  });

  if (errors.length) {
    ResponseHandler.error(res, "Validation errors", 422, errors);
    return;
  }
  try {
    const transaction = await sequelize.transaction();
    const feature = await Feature.create({ image, type }, { transaction });
    try {
      await upsertTranslations(feature.id, { ar }, transaction, type);
      await upsertTranslations(feature.id, { en }, transaction, type);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      if (err instanceof Error) {

        ResponseHandler.error(
          res,
          err.message ?? "Failed to create feature",
          500,
          []
        );
      } else {
        ResponseHandler.error(
          res,
          "Failed to create feature",
          500,
          []
        );
      }
      return;
    }
    featureResposne(res, req, feature)
  } catch (error) {
    if (error instanceof Error) {

      ResponseHandler.error(res, error?.message ?? 'Failed to add page', 500);
    } else {
      ResponseHandler.error(res, 'Failed to add page', 500);

    }
  }
};
export const updateFeature = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;

  const { image, ar, en } = req.body;
  const errors: string[] = [];

  if (!ar || typeof ar !== "object") {
    ResponseHandler.error(res, "Content (ar)", 422, []);
    return;
  }
  if (!en || typeof en !== "object") {
    ResponseHandler.error(res, "Content (en)", 422, []);
    return;
  }

  const arLocales = Object.keys(ar);
  const enLocales = Object.keys(en);
  if (arLocales.length !== enLocales.length) {
    errors.push(
      "Arabic and English content must have the same number of locales"
    );
  }

  arLocales.forEach((locale) => {
    if (!en[locale]) {
      errors.push(`Missing English content for locale: ${locale}`);
    }
  });

  if (errors.length) {
    ResponseHandler.error(res, "Validation errors", 422, errors);
    return;
  }
  try {

    const transaction = await sequelize.transaction();

    const feature = await Feature.findByPk(id, { transaction });

    if (!feature) {
      ResponseHandler.error(res, "Feature not found", 404);
      return;
    }
    if (image) {
      await feature.update({ image })
    }
    try {
      await upsertTranslations(feature.id, { ar }, transaction, feature.type);
      await upsertTranslations(feature.id, { en }, transaction, feature.type);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      if (err instanceof Error) {

        ResponseHandler.error(
          res,
          err.message ?? "Failed to create feature",
          500,
          []
        );
      } else {
        ResponseHandler.error(
          res,
          "Failed to create feature",
          500,
          []
        );
      }
      return;
    }
    featureResposne(res, req, feature)
  } catch (error) {
    if (error instanceof Error) {

      ResponseHandler.error(res, error?.message ?? 'Failed to add page', 500);
    } else {
      ResponseHandler.error(res, 'Failed to add page', 500);

    }
  }
};


export const deleteFeature = async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id;
  const feature = await Feature.findByPk(id);
  if (!feature) {
    ResponseHandler.error(res, "Feature not found", 404);
    return;
  }
  try {
    await feature.destroy();
    ResponseHandler.deleted(res);
  } catch (err) {
    if (err instanceof Error) {

      ResponseHandler.error(res, err?.message ?? "Failed to delete feature", 500);
    } else {
      ResponseHandler.error(res, "Failed to delete feature", 500);

    }
  }
}

export const getFeaturesIndex = async (req: Request, res: Response): Promise<void> => {
  try {
    const locale = req.headers["accept-language"] ?? "en";


    const allowedTypes = ["features", "partners", "technology"] as const;
    type AllowedType = (typeof allowedTypes)[number];

    // Now, cast or validate your value:
    const type = req.query.type as AllowedType;



    if (!type) {
      ResponseHandler.error(res, "Type is required", 404);
      return;
    }

    const features = await Feature.findAll({

      include: [
        {
          model: FeatureTranslation,
          where: { locale },
          attributes: ["name", "desc"],
          required: false,
        },
      ],
      where: { type },
      order: [["updated_at", "DESC"]],
      limit: 10,
      attributes: ["id", "image", "updated_at"],
    });



    const featureRes = features.map((feature) => {
      const resFeature = feature.get();

      const imageUrl = feature.image
        ? `${req.protocol}://${req.get(
          "host"
        )}/images/features/${feature.image.replace(/\\/g, "/")}`
        : null;

      const translation = (feature.FeatureTranslations?.[0] as FeatureTranslation)?.get() || {
        ar: null,
        en: null,
      };

      const { id, ...filterFeatured } = translation

      return {
        id: resFeature.id,

        image: imageUrl,

        ...filterFeatured,
      };
    });

    ResponseHandler.success(res, featureRes);
  } catch (err) {
    if (err instanceof Error) {

      ResponseHandler.error(res, err?.message ?? "Failed to fetch features", 500, []);
    } else {
      ResponseHandler.error(res, "Failed to fetch features", 500, []);

    }
  }
};

export const getFeatureById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const id = req.params.id;
    // const lang = req.headers["accept-language"] || req.headers["Accept-Language"];

    const feature = await Feature.findByPk(id, {
      include: [
        {
          model: FeatureTranslation,
          // where: { locale: lang },
          attributes: ["name", "desc", "locale"],
          required: false,
        },
      ],
      attributes: ["id", "image"],
    });

    if (!feature) {
      ResponseHandler.error(res, "feature not found", 422, []);
      return;
    }

    const resFeature = feature.get();

    let translateData = []

    if (feature.FeatureTranslations.length) {

      translateData = feature.FeatureTranslations.map((t: any) => t.get())
    }


    const translation = translateData.reduce((acc, t) => {

      const { locale, ...rest } = t
      acc[locale] = rest

      return acc;
    }, {} as Record<string, (typeof feature.FeatureTranslations)[number]>) || {
      ar: null,
      en: null,

    };




    const imageUrl = resFeature.image
      ? `${req.protocol}://${req.get(
        "host"
      )}/images/features/${resFeature.image.replace(/\\/g, "/")}`
      : null;

    const response = {
      id: resFeature.id,

      image: imageUrl,
      ...translation,
    };

    res.status(201).json({ data: response });
  } catch (err) {
    if (err instanceof Error) {

      ResponseHandler.error(
        res,
        err.message ?? "Failed to fetch feature",
        500,
        []
      );
    } else {
      ResponseHandler.error(
        res,
        "Failed to fetch feature",
        500,
        []
      );
    }
  }
};
