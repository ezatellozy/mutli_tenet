import { Request, Response } from "express";
import { ResponseHandler } from "../../../utils/responseHandler";
import Settings from "../../models/settings";

export const settingIndex = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Fetch all settings and convert to key-value object
    const allSettings = await Settings.findAll();
    const settingsResponse: Record<string, string | number> =
      allSettings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string | number>);

    // Get requested language
    const lang =
      req.headers["accept-language"] ||
      (req.headers["Accept-Language"] as string) ||
      "en";

    // Fetch home services with translation for the specific locale

    const response = {
      ...settingsResponse,
    };

    // Send success response
    ResponseHandler.success(res, response);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch settings";
    ResponseHandler.error(res, errorMessage, 500);
  }
};
