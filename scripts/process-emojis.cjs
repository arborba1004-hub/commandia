const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "../input");
const OUTPUT_DIR = path.join(__dirname, "../public/emojis");
const DATA_FILE = path.join(__dirname, "../src/data/customEmojis.json");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function generateId() {
  return Date.now().toString();
}

async function removeBg(filePath, outputPath) {
  fs.copyFileSync(filePath, outputPath);
}

function loadJSON() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
}

async function run() {
  if (!fs.existsSync(INPUT_DIR)) return;

  const files = fs.readdirSync(INPUT_DIR);
  if (files.length === 0) return;

  const existing = loadJSON();

  for (const file of files) {
    const name = path.parse(file).name;

    const id = generateId();
    const slug = slugify(name);

    const inputPath = path.join(INPUT_DIR, file);
    const outputFile = `${slug}-${id}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    await removeBg(inputPath, outputPath);

    existing.push({
      id,
      label: name,
      shortcode: `:${slug}:`,
      imageUrl: `/emojis/${outputFile}`
    });

    fs.unlinkSync(inputPath);
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(existing, null, 2));
}

run();