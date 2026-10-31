import Formats from "src/Formats.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";
import { changeExt, decode, encode } from "src/common/index.ts";

// Images bigger than this get re-encoded before being embedded
const MAX_RAW_IMAGE_BYTES = 2 * 1024 * 1024;

class htmlEmbedHandler implements FormatHandler {
  public readonly name = "htmlEmbed";
  public supportedFormats = [
    Formats.HTML.builder("html").lossless().to(),
    Formats.PNG.builder("png").from(),
    Formats.JPEG.builder("jpeg").from(),
    Formats.WEBP.builder("webp").from(),
    Formats.GIF.builder("gif").from(),
    Formats.SVG.builder("svg").from(),
    Formats.TEXT.builder("text").from(),
    Formats.MP4.builder("mp4").from(),
    Formats.MP3.builder("mp3").from(),
  ];
  public ready = false;

  async init() {
    this.ready = true;
  }

  static bytesToBase64(bytes: Uint8Array): string {
    const chunks = [];
    for (let i = 0; i < bytes.length; i += 32768) {
      const byteChunk = bytes.subarray(i, i + 32768);
      chunks.push(String.fromCharCode(...byteChunk));
    }
    return btoa(chunks.join(""));
  }

  /**
   * Lossless intermediates (e.g. PNG from a phone photo) can be many times larger than the
   * original, which makes the resulting page huge. Re-encode big images as WebP before embedding.
   */
  static async shrinkImage(
    bytes: Uint8Array,
    mime: string,
  ): Promise<{ bytes: Uint8Array; mime: string }> {
    if (
      bytes.length < MAX_RAW_IMAGE_BYTES ||
      mime === "image/gif" ||
      typeof OffscreenCanvas === "undefined"
    )
      return { bytes, mime };
    try {
      const bitmap = await createImageBitmap(new Blob([bytes as BlobPart], { type: mime }));
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0);
      bitmap.close();
      const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.9 });
      // Browsers that can't encode WebP silently fall back to PNG; keep the original then
      if (blob.type !== "image/webp" || blob.size >= bytes.length) return { bytes, mime };
      return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: "image/webp" };
    } catch {
      return { bytes, mime };
    }
  }

  async doConvert(
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat,
  ): Promise<FileData[]> {
    if (outputFormat.internal !== "html")
      throw new TypeError(`Unsupported output format: ${outputFormat.internal}`);

    let html = "";

    for (const inputFile of inputFiles) {
      if (inputFormat.internal === "text") {
        const text = decode(inputFile.bytes)
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;");
        html += `<pre>${text}</pre>`;
      } else if (inputFormat.internal === "svg") {
        html += `<div><template shadowrootmode="open">${decode(inputFile.bytes)}</template></div><br>`;
      } else if (inputFormat.mime.startsWith("image/")) {
        const image = await htmlEmbedHandler.shrinkImage(inputFile.bytes, inputFormat.mime);
        const base64 = htmlEmbedHandler.bytesToBase64(image.bytes);
        html += `<img src="data:${image.mime};base64,${base64}"><br>`;
      } else {
        const base64 = htmlEmbedHandler.bytesToBase64(inputFile.bytes);

        if (inputFormat.mime.startsWith("audio/")) {
          html += `<audio controls>
            <source src="data:${inputFormat.mime};base64,${base64}" type="${inputFormat.mime}"></source>
          </audio><br>`;
        } else {
          html += `<video controls>
            <source src="data:${inputFormat.mime};base64,${base64}" type="${inputFormat.mime}"></source>
          </video><br>`;
        }
      }
    }

    const bytes = encode(
      `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>img,video{max-width:100%;height:auto}</style></head><body>${html}</body></html>`,
    );
    const name = changeExt(inputFiles[0].name, outputFormat.extension);
    return [{ bytes, name }];
  }
}

export default htmlEmbedHandler;
