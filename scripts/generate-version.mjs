import fs from "fs";
import path from "path";

const buildId = process.env.NEXT_PUBLIC_APP_BUILD_ID || `${Date.now()}`;
const payload = {
  buildId,
  builtAt: new Date().toISOString(),
};

const publicDir = path.resolve(process.cwd(), "public");
fs.mkdirSync(publicDir, { recursive: true });
fs.writeFileSync(path.join(publicDir, "version.json"), JSON.stringify(payload));
fs.writeFileSync(
  path.resolve(process.cwd(), ".env.production.local"),
  `NEXT_PUBLIC_APP_BUILD_ID=${buildId}\n`
);

console.log(`Generated app build id: ${buildId}`);
