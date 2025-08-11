import { Request, Response } from "express";
import { ResponseHandler } from "../../../utils/responseHandler";
import Settings from "../../models/settings";
import { HomeService, HomeServiceTranslation } from "../../models/services/home_services";
import { Service, ServiceTranslate } from "../../models/services/services";
import { SimpleServiceResource } from "../../response/web/services";

export const settingIndex = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch all settings and convert to key-value object
        const allSettings = await Settings.findAll();
        const settingsResponse: Record<string, string | number> = allSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
        }, {} as Record<string, string | number>);

        // Get requested language
        const lang = (req.headers["accept-language"] || req.headers["Accept-Language"] as string) || "en";

        // Fetch home services with translation for the specific locale
        const services = await Service.findAll({
            include: [
                {
                    model: ServiceTranslate,
                    where: { locale: lang },
                },
            ],

            limit: 5,
        });

        const response = {
            ...settingsResponse,
            services: SimpleServiceResource.collection(services, req).data,
        };

        // Send success response
        ResponseHandler.success(res, response);

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch settings";
        ResponseHandler.error(res, errorMessage, 500);
    }
};
