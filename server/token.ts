import { google } from "googleapis";
import http from "http";
import { URL } from "url";
import dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
const PORT = new URL(REDIRECT_URI).port;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/drive.file"],
});

const server = http.createServer(async (req, res) => {
  if (!req.url) return;
  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get("code");

  if (code) {
    res.end("Authentification réussie, tu peux fermer cet onglet.");
    server.close();

    const { tokens } = await oauth2Client.getToken(code);
    console.log("\n=== GOOGLE_REFRESH_TOKEN ===");
    console.log(tokens.refresh_token);
  }
});

server.listen(Number(PORT), () => {
  console.log("Ouverture du navigateur pour autorisation...");
  console.log(authUrl)
});