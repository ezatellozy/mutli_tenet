import { Request, Response } from "express";
import sequelize from "../../../../utils/database";
import { ResponseHandler } from "../../../../utils/responseHandler";
import { About } from "../../../models/about_us";
import { AboutResource } from "../../../response/admin/about";
import { getAbout } from "../../../services/about";
import { getAboutById } from "../../../services/services";
import { upsertAboutTranslations } from "./helper";

export const createAbout = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { ar, en, video, image } = req.body;

  try {
    const transaction = await sequelize.transaction();
    const existing = await About.findOne();

    let aboutData;

    if (existing) {
      aboutData = await existing.update(
        {
          ...(video && { video: video }),
          ...(image && { image: image }),
        },
        {
          transaction,
        }
      );
    } else {
      aboutData = await About.create(
        {
          ...(video && { video: video }),
          ...(image && { image: image }),
        },
        {
          transaction,
        }
      );
    }

    try {
      await upsertAboutTranslations(aboutData.id, { ar }, transaction);
      await upsertAboutTranslations(aboutData.id, { en }, transaction);
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();

      if (error instanceof Error) {
        ResponseHandler.error(
          res,
          error.message ?? "Failed to create Service",
          500
        );
      } else {
        ResponseHandler.error(res, "Failed to create Service", 500);
      }
      return;
    }

    const aboutRespone = await getAboutById(aboutData.id);
    if (!aboutRespone) {
      ResponseHandler.error(res, "About Not Found");
      return;
    }

    ResponseHandler.success(
      res,
      AboutResource.make(aboutRespone, req, {
        includeTranslations: true,
      }),
      "About created successfully"
    );
  } catch (error) {
    ResponseHandler.error(
      res,
      error instanceof Error ? error.message : "Unknown error",
      422,
      []
    );
    return;
  }
};

export const updateAbout = async (
  req: Request,
  res: Response
): Promise<void> => {
  const id = req.params.id;

  try {
    const transaction = await sequelize.transaction();
    const { ar, en, video, image } = req.body;

    const aboutData = await About.findByPk(id);
    if (!aboutData) {
      ResponseHandler.error(res, "About not found", 422, []);
      return;
    }

    await aboutData.update(
      {
        ...(video && { video: video }),
        ...(image && { image: image }),
      },
      {
        transaction,
      }
    );

    try {
      await upsertAboutTranslations(aboutData.id, { ar }, transaction);
      await upsertAboutTranslations(aboutData.id, { en }, transaction);
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      ResponseHandler.error(
        res,
        err instanceof Error ? err.message : "Failed to update Service",
        500,
        []
      );
      return;
    }

    const aboutRespone = await getAboutById(aboutData.id);
    if (!aboutRespone) {
      ResponseHandler.error(res, "About Not Found");
      return;
    }

    ResponseHandler.success(
      res,
      AboutResource.make(aboutRespone, req, {
        includeTranslations: true,
      }),
      "About created successfully"
    );
  } catch (error) {
    ResponseHandler.error(
      res,
      error instanceof Error ? error.message : "unknown error"
    );
  }
};

export const deleteAbout = async (
  req: Request,
  res: Response
): Promise<void> => {
  const service = await About.findByPk(req.params.id);
  if (!service) {
    ResponseHandler.error(res, "Service not found", 422, []);
    return;
  }

  await service
    .destroy()
    .then(() => ResponseHandler.success(res, "About deleted successfully"))
    .catch((error) =>
      ResponseHandler.error(
        res,
        error instanceof Error ? error.message : "unknown error"
      )
    );
};

export const getAboutId = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const sId = +req.params.id;
    const lang = req.headers["accept-language"] ?? "en";
    const aboutRespone = await getAboutById(sId);
    if (!aboutRespone) {
      ResponseHandler.error(res, "About Not Found");
      return;
    }

    ResponseHandler.success(
      res,
      AboutResource.make(aboutRespone, req, {
        includeTranslations: true,
      })
    );
  } catch (error) {
    ResponseHandler.error(
      res,
      error instanceof Error ? error.message : "unknown error"
    );
  }
};

export const getAboutIndex = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const about = await getAbout();
    if (!about) {
      ResponseHandler.success(res, {});
    } else {
      ResponseHandler.success(
        res,
        AboutResource.make(about, req, {
          includeTranslations: true,
        })
      );
    }
  } catch (error) {
    ResponseHandler.error(
      res,
      error instanceof Error
        ? error.message
        : "An error occurred while fetching the about",
      500
    );
  }
};
