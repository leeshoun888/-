import { mkdir, readdir, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = new URL("../", import.meta.url);
const sourceDir = new URL("../../자료함/사진/", import.meta.url);
const outputDir = new URL("../public/photos/", import.meta.url);
const dataFile = new URL("../src/data/photos.generated.json", import.meta.url);
const sourcePath = fileURLToPath(sourceDir);
const outputPath = fileURLToPath(outputDir);

await mkdir(outputDir, { recursive: true });

const sourceFiles = (await readdir(sourceDir, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(jpe?g|png)$/i.test(entry.name))
  .map((entry) => ({ actual: entry.name, normalized: entry.name.normalize("NFC") }))
  .sort((a, b) => a.normalized.localeCompare(b.normalized, "ko"));

const counters = new Map();
const photos = [];

for (const { actual, normalized: filename } of sourceFiles) {
  const basename = filename.slice(0, -extname(filename).length);
  const dated = basename.match(/^(\d{2})-(\d{2})(?:-(.*))?$/);

  // This supplied photo is the undated companion to the 04-25 confession set.
  const month = dated ? dated[1] : "04";
  const day = dated ? dated[2] : "25";
  const rawCaption = dated ? dated[3] : basename;
  const dateKey = `${month}-${day}`;
  const nextIndex = (counters.get(dateKey) ?? 0) + 1;
  counters.set(dateKey, nextIndex);

  const safeName = `${dateKey}-${String(nextIndex).padStart(2, "0")}.webp`;
  await sharp(join(sourcePath, actual))
    .rotate()
    .resize({
      width: 1280,
      height: 1280,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 78, effort: 5, smartSubsample: true })
    .toFile(join(outputPath, safeName));

  photos.push({
    id: safeName.replace(/\.[^.]+$/, ""),
    date: `2026-${dateKey}`,
    displayDate: `${Number(month)}월 ${Number(day)}일`,
    caption: rawCaption?.trim() || `${Number(month)}월 ${Number(day)}일의 우리`,
    src: `/photos/${safeName}`,
  });
}

photos.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
await writeFile(dataFile, `${JSON.stringify(photos, null, 2)}\n`, "utf8");

console.log(`Prepared ${photos.length} photos from ${sourcePath}`);
console.log(`Wrote ${fileURLToPath(dataFile)}`);
