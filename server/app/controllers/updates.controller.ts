import { HttpContext } from "../../config/app.js";
import { ApiResponse } from "../helpers/api-response.js";

export class UpdatesController {
  async getMetadata(c: HttpContext) {
    const metadata = {
      version: "1.0.0",
      forceUpdate: false,
      message: "Bienvenue sur PipoLink!"
    };
    return ApiResponse.success(c, metadata, "Métadonnées de mise à jour récupérées.");
  }
}
