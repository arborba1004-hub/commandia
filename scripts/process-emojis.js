const fs = require("fs");
const path = require("path");

// aqui vamos usar remove.bg API (ou alternativa local depois)
const INPUT_DIR = path.join(__dirname, "../input");
const OUTPUT_DIR = path.join(__dirname, "../public/emojis");
const DATA_FILE = path.join(__dirname, "../src/data/customEmojis.ts");

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-");
}

function generateId() {
  return Date.now().toString();
}

// MOCK remove background (trocar depois por API real)
async function removeBg(filePath, outputPath) {
  fs.copyFileSync(filePath, outputPath);
}

async function run() {
  if (!fs.existsSync(INPUT_DIR)) return;

  const files = fs.readdirSync(INPUT_DIR);

  let existing = fs.readFileSync(DATA_FILE, "utf-8");

  let newEntries = [];

  for (const file of files) {
    const name = path.parse(file).name;
    const id = generateId();
    const shortcode = `:${slugify(name)}:`;

    const inputPath = path.join(INPUT_DIR, file);
    const outputFile = `${slugify(name)}-${id}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    await removeBg(inputPath, outputPath);

    newEntries.push({
      id,
      label: name,
      shortcode,
      imageUrl: `/emojis/${outputFile}`
    });

    fs.unlinkSync(inputPath);
  }

  if (newEntries.length === 0) return;

  // inject into TS file
  const insert = newEntries
    .map(
      (e) => `  { id: "${e.id}", label: "${e.label}", shortcode: "${e.shortcode}", imageUrl: "${e.imageUrl}" }`
    )
    .join(",\n");

  const updated = existing.replace(
  /export const CUSTOM_EMOJIS\s*=\s*\[/,
  `export const CUSTOM_EMOJIS: CustomEmoji[] = [\n${insert},`
);

  fs.writeFileSync(DATA_FILE, updated);
}

run();