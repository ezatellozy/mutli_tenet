import { Request, Response } from "express";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import {
  SectionFeature,
  SectionFeatureTranslation,
} from "../../../models/service_sections/sectionFeatures";
import {
  ServiceSections,
  ServiceSectionsTranslation,
} from "../../../models/service_sections/sections";
import { upsertFeatureTranslations, upsertSectionTranslations } from "./helper";

import { ServiceSectionResource } from "../../../response/admin/ServiceSectionResource";

export const createSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  const langHeader = req.headers["accept-language"];
  const lang = Array.isArray(langHeader) ? langHeader[0] : langHeader ?? "en";
  const service_id = req.params.id;

  const { ordering, ar, en, video, image, background, type, features } =
    req.body;
  const errors: string[] = [];

  if (!type) errors.push("Type is required");

  if (errors.length > 0) {
    ResponseHandler.error(res, errors[0], 422, errors);
    return;
  }

  const transaction = await sequelize.transaction();
  try {
    const sectionData = await ServiceSections.create(
      {
        service_id,
        type: type,
        ...(ordering && { ordering: ordering }),
        ...(video && { video: video }),
        ...(image && { image: image }),
        ...(background && { background: background }),
      },
      {
        transaction,
      }
    );

    // Process translations
    await upsertSectionTranslations(sectionData.id, { ar }, transaction);
    await upsertSectionTranslations(sectionData.id, { en }, transaction);
    if (Array.isArray(features)) {
      for (const feature of features) {
        const { icon, ar, en } = feature;
        const newFeature = await SectionFeature.create(
          {
            ...(icon && { icon }),
            service_section_id: sectionData.id,
          },
          { transaction }
        );

        await upsertFeatureTranslations(newFeature.id, { ar }, transaction);
        await upsertFeatureTranslations(newFeature.id, { en }, transaction);
      }
    }

    await transaction.commit();

    const service_section = await ServiceSections.findByPk(sectionData.id, {
      include: [
        {
          model: ServiceSectionsTranslation,
          attributes: ["title", "desc", "locale"],
        },
        {
          model: SectionFeature,
          include: [
            {
              model: SectionFeatureTranslation,
              attributes: ["title", "desc", "locale"],
            },
          ],
        },
      ],
    });
    if (!service_section) {
      ResponseHandler.error(res, "Service not found!");
      return;
    }

    ResponseHandler.success(
      res,
      ServiceSectionResource.make(service_section, req, {}, lang),
      "Section created successfully"
    );
  } catch (error) {
    await transaction.rollback();

    ResponseHandler.error(
      res,
      error instanceof Error ? error.message : "Unknown error",
      422,
      []
    );
    return;
  }
};

export const updateSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.section;
  const langHeader = req.headers["accept-language"];
  const lang = Array.isArray(langHeader) ? langHeader[0] : langHeader ?? "en";

  const { ordering, ar, en, video, image, background, type, features } =
    req.body;

  const transaction = await sequelize.transaction();

  try {
    // Check if section exists
    const existing = await ServiceSections.findByPk(id);
    if (!existing) {
      await transaction.rollback();
      ResponseHandler.error(res, "Section not found", 404);
      return
    }

    // Update section data
    const sectionData = await existing.update(
      {
        ...(type && { type }),
        ...(ordering && { ordering }),
        ...(video && { video }),
        ...(image && { image }),
        ...(background && { background }),
      },
      { transaction }
    );

    // Update translations
    await upsertSectionTranslations(sectionData.id, { ar }, transaction);
    await upsertSectionTranslations(sectionData.id, { en }, transaction);

    // Handle features
    if (Array.isArray(features)) {
      for (const feature of features) {
        const { id: featureId, icon, ar, en } = feature;
        let featureRecord;

        if (featureId) {
          const existingFeature = await SectionFeature.findByPk(featureId);
          if (existingFeature) {
            featureRecord = await existingFeature.update(
              {
                ...(icon && { icon }),
                service_section_id: sectionData.id,
              },
              { transaction }
            );
          } else {
            featureRecord = await SectionFeature.create(
              {
                ...(icon && { icon }),
                service_section_id: sectionData.id,
              },
              { transaction }
            );
          }
        } else {
          featureRecord = await SectionFeature.create(
            {
              ...(icon && { icon }),
              service_section_id: sectionData.id,
            },
            { transaction }
          );
        }

        // Update feature translations
        await upsertFeatureTranslations(featureRecord.id, { ar }, transaction);
        await upsertFeatureTranslations(featureRecord.id, { en }, transaction);
      }
    }

    await transaction.commit();

    // Fetch updated section with full relations
    const service_section = await ServiceSections.findByPk(sectionData.id, {
      include: [
        {
          model: ServiceSectionsTranslation,
          attributes: ["title", "desc", "locale"],
        },
        {
          model: SectionFeature,
          include: [
            {
              model: SectionFeatureTranslation,
              attributes: ["title", "desc", "locale"],
            },
          ],
        },
      ],
    });

    if (!service_section) {
      ResponseHandler.error(res, "Service section not found", 404);
      return
    }

    res.status(200).json({
      message: "Section updated successfully",
      data: ServiceSectionResource.make(service_section, req, {}, lang),
    });
    return
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return
  }
};

export const getSectionIndex = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const langHeader = req.headers["accept-language"];
    const lang = Array.isArray(langHeader) ? langHeader[0] : langHeader ?? "en";
    const service_id = parseInt(req.params.id as string);
    const service_sections = await ServiceSections.findAll({
      where: { service_id },
      include: [
        {
          model: ServiceSectionsTranslation,
          attributes: ["title", "desc", "locale"],
        },
        {
          model: SectionFeature,
          include: [
            {
              model: SectionFeatureTranslation,
              attributes: ["id", "title", "desc", "locale"],
            },
          ],
        },
      ],
    });

    ResponseHandler.paginated(
      res,
      ServiceSectionResource.collection(service_sections, req, {}, lang)
    );
  } catch (err) {
    ResponseHandler.error(res, "Failed to fetch servces", 422, []);
  }
};

export const deleteSection = async (
  req: Request,
  res: Response
): Promise<void> => {
  const section = await ServiceSections.findByPk(req.params.section);
  if (!section) {
    ResponseHandler.error(res, "Section not found", 422);
    return;
  }
  await section
    .destroy()
    .then(() => ResponseHandler.deleted(res, "Section deleted successfully"))
    .catch((error) =>
      ResponseHandler.error(res, error?.message || "unknown error", 500)
    );
};
export const deleteSectionFeature = async (
  req: Request,
  res: Response
): Promise<void> => {
  const section = await SectionFeature.findByPk(req.params.id);
  if (!section) {
    ResponseHandler.error(res, "Section not found", 422);
    return;
  }
  await section
    .destroy()
    .then(() => ResponseHandler.deleted(res, "Feature deleted successfully"))
    .catch((error) =>
      ResponseHandler.error(res, error?.message || "unknown error", 500)
    );
};
