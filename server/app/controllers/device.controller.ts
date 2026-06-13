import { HttpContext } from "../../config/app.js";
import { DeviceService } from "../services/device.service.js";
import { ApiResponse } from "../helpers/api-response.js";
import { rotateDeviceKeysValidator } from "../validators/device.validator.js";
import { RealtimeBus } from "../../src/modules/websocket/gateway/realtime-bus.js";
import { WsEventName } from "../../src/modules/websocket/events/event-names.js";

export class DeviceController {
  private service = new DeviceService();

  async list(c: HttpContext) {
    const userId = c.get("userId") as string;
    const devices = await this.service.listDevices(userId);
    return ApiResponse.success(c, devices, "Appareils récupérés.");
  }

  async revoke(c: HttpContext) {
    const userId = c.get("userId") as string;
    const deviceId = c.req.param("id")!;
    await this.service.revokeDevice(userId, deviceId);
    RealtimeBus.emit(WsEventName.DeviceRevoked, { deviceId }, { userId });
    return ApiResponse.success(c, null, "Appareil révoqué.");
  }

  async rotateKeys(c: HttpContext) {
    const userId = c.get("userId") as string;
    const deviceId = c.req.param("id")!;
    const payload = await c.validateUsing(rotateDeviceKeysValidator);
    await this.service.rotateDeviceKey(userId, deviceId, payload);
    return ApiResponse.success(c, null, "Clés de l'appareil mises à jour. Reconnectez-vous sur cet appareil.");
  }
  async updateFcmToken(c: HttpContext) {
    const deviceId = c.get("deviceId") as string;
    const body = await c.req.json();
    if (!body.token || typeof body.token !== "string") {
      return ApiResponse.error(c, "VALIDATION_ERROR", "Token FCM requis", 400);
    }
    await this.service.updateFcmToken(deviceId, body.token);
    return ApiResponse.success(c, null, "Token FCM mis à jour.");
  }
}
