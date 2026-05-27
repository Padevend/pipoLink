import { HttpContext } from "../../config/app.js";
import { ApiResponse } from "../helpers/api-response.js";

export class UpdatesController {
  async getMetadata(c: HttpContext) {
    const metadata = {
      version: "1.0.0",
      changelog: ["Amélioration de l'interface utilisateur", "Correction de bugs"],
      isRequired: false,
      minSdkVersion: "21",
      severity: 'low',
      type: 'manual',
      links: [
        {
          platform: 'android',
          link: "https://play.google.com/store/apps/details?id=com.example.app",
        },
        {
          platform: 'ios',
          link: "https://apps.apple.com/app/id123456789",
        },
      ]
    };
    return ApiResponse.success(c, metadata, "Métadonnées de mise à jour récupérées.");
  }
}
