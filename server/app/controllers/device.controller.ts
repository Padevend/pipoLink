import { HttpContext } from "../../config/app.js";
import { DeviceService } from "../services/device.service.js";
import { ApiResponse } from "../helpers/api-response.js";
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
    const deviceId = c.req.param("id");
    await this.service.revokeDevice(userId, deviceId);
    RealtimeBus.emit(WsEventName.DeviceRevoked, { deviceId }, { userId });
    return ApiResponse.success(c, null, "Appareil révoqué.");
  }
}
