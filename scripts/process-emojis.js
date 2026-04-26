const fs = require("fs");
const path = require("path");

// Diretórios
const INPUT_DIR = path.join(__dirname, "../input");
const OUTPUT_DIR = path.join(__dirname, "../public/emojis");
const DATA_FILE = path.join(__dirname, "../src/data/customEmojis.ts");

// garante pasta de saída
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// utils
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

// MOCK remove background (por enquanto)
async function removeBg(filePath, outputPath) {
  fs.copyFileSync(filePath, outputPath);
}

// lê arquivo TS
function loadFile() {
  if (!fs.existsSync(DATA_FILE)) {
    return `export const CUSTOM_EMOJIS: CustomEmoji[] = [];\n`;
  }
  return fs.readFileSync(DATA_FILE, "utf-8");
}

// extrai array atual de forma segura
function extractOldEmojis(content) {
  const start = content.indexOf("export const CUSTOM_EMOJIS");
  if (start === -1) return [];

  const open = content.indexOf("[", start);
  const close = content.indexOf("];", open);

  if (open === -1 || close === -1) return [];

  const arrayContent = content
    .slice(open + 1, close)
    .trim();

  if (!arrayContent) return [];

  // separa por linha ignorando vazios
  return arrayContent
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);
}

async function run() {
  if (!fs.existsSync(INPUT_DIR)) return;

  const files = fs.readdirSync(INPUT_DIR);
  if (files.length === 0) return;

  const existing = loadFile();
  const oldEmojis = extractOldEmojis(existing);

  let newEntries = [];

  for (const file of files) {
    const name = path.parse(file).name;

    const id = generateId();
    const slug = slugify(name);

    const inputPath = path.join(INPUT_DIR, file);
    const outputFile = `${slug}-${id}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputFile);

    await removeBg(inputPath, outputPath);

    newEntries.push(
      `  { id: "${id}", label: "${name}", shortcode: ":${slug}:", imageUrl: "/emojis/${outputFile}" }`
    );

    fs.unlinkSync(inputPath);
  }

  if (newEntries.length === 0) return;

  // junta antigos + novos
  const allEmojis = [...oldEmojis, ...newEntries].join(",\n");

  const updated = `
export const CUSTOM_EMOJIS: CustomEmoji[] = [
${allEmojis}
];
`;

  fs.writeFileSync(DATA_FILE, updated.trim());
}

run();