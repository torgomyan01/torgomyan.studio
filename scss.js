const sass = require("sass");
const fs = require("fs");
const path = require("path");

function compileScssOnSave(scssPath, cssPath) {
  // Watch the SCSS file for changes
  fs.watchFile(scssPath, { interval: 500 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      try {
        const result = sass.compile(scssPath, {
          sourceMap: true,
          sourceMapIncludeSources: true,
          style: "expanded",
        });

        // Resolve map path and ensure CSS references it
        const sourceMapPath = cssPath + ".map";
        const sourceMapFileName = path.basename(sourceMapPath);

        // Append sourceMappingURL comment to CSS so devtools can find the map
        const cssWithMapRef =
          String(result.css).trimEnd() +
          "\n/*# sourceMappingURL=" +
          sourceMapFileName +
          " */\n";

        // Write CSS file
        fs.writeFileSync(cssPath, cssWithMapRef);

        // Write source map file (result.sourceMap may be object or string)
        const mapContent =
          typeof result.sourceMap === "string"
            ? result.sourceMap
            : JSON.stringify(result.sourceMap);
        fs.writeFileSync(sourceMapPath, mapContent);

        console.log(
          `SCSS compiled: ${scssPath} -> ${cssPath} (with source map)`
        );
      } catch (err) {
        console.error("SCSS compilation error:", err);
      }
    }
  });
}

// Usage:
compileScssOnSave("css/style.scss", "css/style.css");
