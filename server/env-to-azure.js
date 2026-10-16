#!/usr/bin/env node
/**
 * Convertit un fichier .env en settings.json compatible Azure App Service.
 *
 * Usage :
 *   node env-to-azure.js [fichier.env] [settings.json] [--slot]
 *
 * Exemples :
 *   node env-to-azure.js
 *   node env-to-azure.js .env.prod settings.json
 *   node env-to-azure.js .env settings.json --slot   (slotSetting = true)
 *
 * Utilisation ensuite avec Azure CLI :
 *   az webapp config appsettings set -g <rg> -n <app> --settings @settings.json
 */
import fs from "fs"
import path from "path"

// --- Arguments ---------------------------------------------------------------
const args = process.argv.slice(2);
const slotSetting = args.includes("--slot");
const positional = args.filter((a) => !a.startsWith("--"));

const inputFile = path.resolve(positional[0] || ".env");
const outputFile = path.resolve(positional[1] || "settings.json");

// --- Parsing du .env ---------------------------------------------------------
function parseEnv(content) {
  const result = [];

  for (const rawLine of content.split(/\r?\n/)) {
    let line = rawLine.trim();

    // Ignorer lignes vides et commentaires
    if (!line || line.startsWith("#")) continue;

    // Supporter le préfixe "export KEY=value"
    if (line.startsWith("export ")) line = line.slice(7).trim();

    // Séparer sur le PREMIER "=" uniquement (la valeur peut contenir des "=")
    const idx = line.indexOf("=");
    if (idx === -1) {
      console.warn(`⚠️  Ligne ignorée (pas de "=") : ${rawLine}`);
      continue;
    }

    const name = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (!name) {
      console.warn(`⚠️  Ligne ignorée (clé vide) : ${rawLine}`);
      continue;
    }

    // Retirer les guillemets autour de la valeur : "val" ou 'val'
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }

    result.push({ name, value, slotSetting });
  }

  return result;
}

// --- Exécution ---------------------------------------------------------------
try {
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Fichier introuvable : ${inputFile}`);
    process.exit(1);
  }

  const content = fs.readFileSync(inputFile, "utf8");
  const settings = parseEnv(content);

  fs.writeFileSync(outputFile, JSON.stringify(settings, null, 4), "utf8");

  console.log(`✅ ${settings.length} variable(s) converties`);
  console.log(`   ${inputFile}`);
  console.log(`   → ${outputFile}`);
} catch (err) {
  console.error("❌ Erreur :", err.message);
  process.exit(1);
}