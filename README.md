# Gorin

**Convert almost any file to almost any format — privately, right in your browser.**

🌐 **https://mostafasadeghidev.github.io/gorin/**

_Gorin (گۆڕین) means "to change" in Kurdish._

- **Private:** everything runs on your device. Your files are never uploaded anywhere.
- **Universal:** hundreds of formats, and it can convert across mediums (image → PDF, video → GIF, document → image, …).
- **Batch friendly:** drop many files at once; each one gets its own output, downloadable one by one or as a single ZIP.
- **Free:** no sign-up, no limits, open source.

## Usage

1. Open the site.
2. Click the big box (or drag your files onto the page, or paste them).
3. The input format is usually detected automatically. If not, search for it.
4. Pick the output format and press **Convert**.

## Development

1. Install [Bun](https://bun.sh/).
2. Run `bun install`.
3. Run `bun run dev` to prepare dependencies and start the dev server.

For a production build, run `bun run build` and then `bun run cache:build`, and serve the `dist/` folder with any static HTTP server. Pushing to `master` deploys the site to GitHub Pages automatically.

### Docker

```bash
docker compose -f docker/docker-compose.yml -f docker/docker-compose.override.yml up --build -d
```

The site will be available at `http://localhost:8080/convert/`.

### Project layout

- `src/handlers/` — one wrapper ("handler") per conversion tool. Each handler lists the formats it can read/write and implements `doConvert`. See `src/FormatHandler.ts` for the interface and register new handlers in `src/handlers/index.ts`.
- `src/ui/` — the Preact interface.
- `recipe/` and `prebuilt/` — external dependencies assembled at build time (`bun run build:assemble`).
- `test/` — conversion and graph traversal tests (`bun test ./test/`).

## License

Gorin is free software, licensed under the [GNU General Public License v2.0](LICENSE). It is based on an existing open-source GPL-2.0 file converter project and remains under the same license.
