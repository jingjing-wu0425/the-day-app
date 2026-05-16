const sharp = require("sharp");
const path = require("path");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#FFFFFF"/>
  <text x="256" y="330" font-family="Georgia, serif" font-size="220" fill="#1A1A1A" text-anchor="middle" font-weight="bold">Day.</text>
</svg>`;

const sizes = [
  { name: "mipmap-mdpi/ic_launcher.png", size: 48 },
  { name: "mipmap-hdpi/ic_launcher.png", size: 72 },
  { name: "mipmap-xhdpi/ic_launcher.png", size: 96 },
  { name: "mipmap-xxhdpi/ic_launcher.png", size: 144 },
  { name: "mipmap-xxxhdpi/ic_launcher.png", size: 192 },
  { name: "mipmap-mdpi/ic_launcher_foreground.png", size: 108 },
  { name: "mipmap-hdpi/ic_launcher_foreground.png", size: 162 },
  { name: "mipmap-xhdpi/ic_launcher_foreground.png", size: 216 },
  { name: "mipmap-xxhdpi/ic_launcher_foreground.png", size: 324 },
  { name: "mipmap-xxxhdpi/ic_launcher_foreground.png", size: 432 },
];

const base = path.join(__dirname, "android", "app", "src", "main", "res");

async function generate() {
  for (const { name, size } of sizes) {
    const outPath = path.join(base, name);
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(outPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  // Also generate PWA icons
  const pwaDir = path.join(__dirname, "public", "icons");
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile(path.join(pwaDir, "icon-192.png"));
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile(path.join(pwaDir, "icon-512.png"));
  console.log("Generated PWA icons");
}

generate().catch(console.error);
