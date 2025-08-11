import { Request, Response } from "express";
import sequelize from "../../../utils/database";
import { ResponseHandler } from "../../../utils/responseHandler";
import { AppError } from "../../middleware/errorHandler";
import Tenant from "../../models/tenant";
import { Op } from "sequelize";
import { generateTenantIdentifiers } from "../../../utils/tenantNameUtils";
import Domain from "../../models/domain";
import { provisionMyTenant } from "../../services/provisionMySQL";

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

export function dbNameFromTenant(tenantKey: string) {
  return `t_${tenantKey.toLowerCase().replace(/[^a-z0-9_]/g, "_")}`;
}

export const createTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  const {
    name,
    password,
    email,
    phone,
    image,
    company_name,
    preferred_subdomain,
  } = req.body;

  try {
    const transaction = await sequelize.transaction();

    try {
      const { tenantKey, subdomainLabel, dbName } =
        await generateTenantIdentifiers({
          companyName: company_name,
          preferredSubdomain: preferred_subdomain,
          checkTenantKeyExists: async (k) =>
            !!(await Tenant.findOne({ where: { tenant_key: k } })),
          checkSubdomainExists: async (label) =>
            !!(await Domain.findOne({
              where: { host: `${label}.yourdomain.com` },
            })),
        });

      const tenant = await Tenant.create({
        company_name,
        name,
        password,

        email,
        phone,
        image,
        tenant_key: tenantKey,
        dbName,
        subdomain: `${subdomainLabel}.yourdomain.com`,
        preferred_subdomain,
      });

      const { tenantDbUrl } = await provisionMyTenant({
        tenantKey,
        dbName,
      });

      await Domain.create({
        tenant_id: tenant.id,
        host: `${subdomainLabel}.yourdomain.com`,
        type: "managed_subdomain",
        verified: true,
      });

      tenant.db_url = tenantDbUrl;
      await tenant.save();

      ResponseHandler.success(res, tenant);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();

      if (err instanceof Error) {
        ResponseHandler.error(
          res,
          err.message ?? "Failed to create page",
          500,
          []
        );
      } else {
        ResponseHandler.error(res, "Failed to create page", 500, []);
      }

      return;
    }

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

export const getAllTenants = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const tenants = await Tenant.findAll({
      // attributes: ["image", "name", "email", "is_active"],
    });

    // const imageUrl = resPage.image
    //     ? `${req.protocol}://${req.get(
    //         "host"
    //     )}/images/pages/${resPage.image.replace(/\\/g, "/")}`
    //     : null;
    // const videoUrl = resPage.video
    //     ? `${req.protocol}://${req.get(
    //         "host"
    //     )}/files/pages/${resPage.video.replace(/\\/g, "/")}`
    //     : null;

    ResponseHandler.success(res, tenants);
  } catch (error) {
    if (error instanceof Error) {
      ResponseHandler.error(
        res,
        error?.message || "Failed to fetch pages",
        500,
        []
      );
    } else {
      ResponseHandler.error(res, "Failed to fetch pages", 500, []);
    }
  }
};
