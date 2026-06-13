import { HttpContext } from "../../config/app.js";
import { ApiResponse } from "../helpers/api-response.js";

export class UpdatesController {
  async getMetadata(c: HttpContext) {
    const metadata = {
      version: "1.2.1",
      changelog: ["Amélioration de l'interface utilisateur", "Correction de bugs"],
      isRequired: false,
      minSdkVersion: "24",
      severity: 'low',
      type: 'auto',
      links: [
        {
          platform: 'android',
          link: "https://api-plink.lyrastudio.org/storage/release/V1.2.1/pipolink-app-release.apk",
        }
      ]
    };
    return ApiResponse.success(c, metadata, "Métadonnées de mise à jour récupérées.");
  }
}
