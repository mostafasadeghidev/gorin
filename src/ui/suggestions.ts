import type { CategoryType } from "src/Formats";
import type { FileFormat } from "src/FormatHandler";

/** Output extensions people most often want for each kind of input, best first */
const SUGGESTED_EXTENSIONS: Record<CategoryType, string[]> = {
  image: ["jpg", "png", "webp", "avif", "pdf", "gif", "ico", "bmp", "tiff", "svg"],
  vector: ["svg", "png", "pdf", "jpg", "webp"],
  video: ["mp4", "webm", "gif", "mov", "mkv", "mp3", "avi"],
  audio: ["mp3", "wav", "m4a", "ogg", "flac", "opus", "aac"],
  document: ["pdf", "docx", "txt", "html", "md", "markdown", "odt", "epub"],
  text: ["txt", "pdf", "docx", "html", "md", "markdown"],
  spreadsheet: ["xlsx", "csv", "ods", "pdf", "json"],
  presentation: ["pdf", "pptx", "odp", "png", "jpg"],
  data: ["json", "csv", "xml", "yaml", "xlsx"],
  code: ["txt", "html", "pdf"],
  archive: ["zip", "7z", "tar", "gz"],
  font: ["ttf", "otf", "woff2", "woff"],
  model: ["glb", "gltf", "obj", "stl"],
  database: ["csv", "json", "xlsx", "sqlite"],
};

export function categoriesOf(format: FileFormat): CategoryType[] {
  return Array.isArray(format.category) ? format.category : [format.category];
}

/**
 * Ordered list of suggested output extensions for the given input categories.
 * Categories are interleaved so mixed inputs (e.g. images and videos) get the top picks of each.
 */
export function getSuggestedExtensions(
  categories: CategoryType[],
  exclude: string[] = [],
): string[] {
  const lists = [...new Set(categories)].map((category) => SUGGESTED_EXTENSIONS[category] ?? []);
  const excluded = new Set(exclude.map((ext) => ext.toLowerCase()));
  const result: string[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const ext = list[i];
      if (ext && !excluded.has(ext) && !result.includes(ext)) result.push(ext);
    }
  }
  return result;
}
