import { HttpContext } from "../../config/app.js";
import { prisma } from "../../config/database.js";
import { ApiResponse } from "../helpers/api-response.js";
import type { Prisma } from "../../generated/prisma/client.js";

const catalogInclude = {
  levels: {
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      units: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] },
    },
  },
} satisfies Prisma.AcademicFiliereInclude;

function cleanName(value: unknown): string | null {
  return typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 160
    ? value.trim()
    : null;
}

function optionalOrder(value: unknown): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

function optionalActive(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

/** Public, read-only catalogue used by the mobile cascading picker. */
export class AcademicPathController {
  async list(c: HttpContext) {
    const catalog = await prisma.academicFiliere.findMany({
      where: { isActive: true },
      include: catalogInclude,
    });
    const visible = catalog.map((filiere) => ({
      ...filiere,
      levels: filiere.levels
        .filter((level) => level.isActive)
        .map((level) => ({
          ...level,
          units: level.units.filter((unit) => unit.isActive),
        })),
    }));
    return ApiResponse.success(c, visible, "Parcours académiques récupérés.");
  }
}

/** CRUD reserved to administrators; deletion cascades only inside the catalogue. */
export class AdminAcademicPathController {
  async list(c: HttpContext) {
    const catalog = await prisma.academicFiliere.findMany({ include: catalogInclude });
    return ApiResponse.success(c, catalog, "Catalogue académique récupéré.");
  }

  async createFiliere(c: HttpContext) {
    const body = await c.req.json();
    const name = cleanName(body.name);
    if (!name)
      return ApiResponse.error(
        c,
        "VALIDATION_ERROR",
        "Nom de filière invalide.",
        400,
      );
    const filiere = await prisma.academicFiliere.create({
      data: {
        name: name ?? undefined,
        sortOrder: optionalOrder(body.sortOrder) ?? 0,
        isActive: optionalActive(body.isActive) ?? true,
      },
    });
    return ApiResponse.success(c, filiere, "Filière créée.", 201);
  }

  async updateFiliere(c: HttpContext) {
    const body = await c.req.json();
    const name = body.name === undefined ? undefined : cleanName(body.name);
    if (body.name !== undefined && !name)
      return ApiResponse.error(
        c,
        "VALIDATION_ERROR",
        "Nom de filière invalide.",
        400,
      );
    const filiere = await prisma.academicFiliere.update({
      where: { id: c.req.param("id")! },
      data: {
        name: name ?? undefined,
        sortOrder: optionalOrder(body.sortOrder),
        isActive: optionalActive(body.isActive),
      },
    });
    return ApiResponse.success(c, filiere, "Filière mise à jour.");
  }

  async deleteFiliere(c: HttpContext) {
    await prisma.academicFiliere.delete({ where: { id: c.req.param("id")! } });
    return ApiResponse.success(c, null, "Filière supprimée.");
  }

  async createLevel(c: HttpContext) {
    const body = await c.req.json();
    const name = cleanName(body.name);
    if (!name || typeof body.filiereId !== "string")
      return ApiResponse.error(c, "VALIDATION_ERROR", "Niveau invalide.", 400);
    const level = await prisma.academicLevel.create({
      data: {
        filiereId: body.filiereId,
        name,
        sortOrder: optionalOrder(body.sortOrder) ?? 0,
        isActive: optionalActive(body.isActive) ?? true,
      },
    });
    return ApiResponse.success(c, level, "Niveau créé.", 201);
  }

  async updateLevel(c: HttpContext) {
    const body = await c.req.json();
    const name = body.name === undefined ? undefined : cleanName(body.name);
    if (body.name !== undefined && !name)
      return ApiResponse.error(
        c,
        "VALIDATION_ERROR",
        "Nom de niveau invalide.",
        400,
      );
    const level = await prisma.academicLevel.update({
      where: { id: c.req.param("id")! },
      data: {
        name: name ?? undefined,
        sortOrder: optionalOrder(body.sortOrder),
        isActive: optionalActive(body.isActive),
      },
    });
    return ApiResponse.success(c, level, "Niveau mis à jour.");
  }

  async deleteLevel(c: HttpContext) {
    await prisma.academicLevel.delete({ where: { id: c.req.param("id")! } });
    return ApiResponse.success(c, null, "Niveau supprimé.");
  }

  async createUnit(c: HttpContext) {
    const body = await c.req.json();
    const name = cleanName(body.name);
    if (!name || typeof body.levelId !== "string")
      return ApiResponse.error(
        c,
        "VALIDATION_ERROR",
        "Unité d'enseignement invalide.",
        400,
      );
    const unit = await prisma.academicUnit.create({
      data: {
        levelId: body.levelId,
        name,
        sortOrder: optionalOrder(body.sortOrder) ?? 0,
        isActive: optionalActive(body.isActive) ?? true,
      },
    });
    return ApiResponse.success(c, unit, "Unité d'enseignement créée.", 201);
  }

  async updateUnit(c: HttpContext) {
    const body = await c.req.json();
    const name = body.name === undefined ? undefined : cleanName(body.name);
    if (body.name !== undefined && !name)
      return ApiResponse.error(
        c,
        "VALIDATION_ERROR",
        "Nom d'unité invalide.",
        400,
      );
    const unit = await prisma.academicUnit.update({
      where: { id: c.req.param("id")! },
      data: {
        name: name ?? undefined,
        sortOrder: optionalOrder(body.sortOrder),
        isActive: optionalActive(body.isActive),
      },
    });
    return ApiResponse.success(c, unit, "Unité d'enseignement mise à jour.");
  }

  async deleteUnit(c: HttpContext) {
    await prisma.academicUnit.delete({ where: { id: c.req.param("id")! } });
    return ApiResponse.success(c, null, "Unité d'enseignement supprimée.");
  }
}
