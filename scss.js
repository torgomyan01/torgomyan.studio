const sass = require("sass");
const fs = require("fs");
const path = require("path");

function compileScss(scssPath, cssPath) {
  const startTime = Date.now();
  try {
    console.log(`\n[COMPILING] Starting compilation...`);
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

    const duration = Date.now() - startTime;
    console.log(
      `✓ SCSS compiled successfully in ${duration}ms: ${scssPath} -> ${cssPath}`
    );
  } catch (err) {
    console.error(`✗ SCSS compilation error:`, err.message);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

function watchSectionsDirectory(sectionsDir, scssPath, cssPath) {
  if (!fs.existsSync(sectionsDir)) {
    console.log(`Sections directory not found: ${sectionsDir}`);
    return;
  }

  const watchedFiles = new Map(); // Use Map to store watchers

  // Function to watch all SCSS files in sections directory
  function watchAllSectionFiles() {
    try {
      const files = fs.readdirSync(sectionsDir);
      files.forEach((file) => {
        if (file.endsWith(".scss")) {
          const filePath = path.join(sectionsDir, file);
          const normalizedPath = path.resolve(filePath);

          // Skip if already watching
          if (watchedFiles.has(normalizedPath)) return;

          // Check if file exists
          if (!fs.existsSync(filePath)) return;

          // Watch individual file with fs.watchFile
          const watcher = fs.watchFile(
            filePath,
            { interval: 300 },
            (curr, prev) => {
              // Check if file was actually modified
              if (curr.mtime.getTime() !== prev.mtime.getTime()) {
                console.log(
                  `\n[CHANGE DETECTED] Section file changed: ${file}`
                );
                console.log(`  Previous: ${prev.mtime}`);
                console.log(`  Current: ${curr.mtime}`);
                compileScss(scssPath, cssPath);
              }
            }
          );

          watchedFiles.set(normalizedPath, watcher);
          console.log(`✓ Watching section file: ${file} (${normalizedPath})`);
        }
      });
    } catch (err) {
      console.error(`Error reading sections directory: ${err.message}`);
    }
  }

  // Also use fs.watch for directory-level monitoring (backup)
  try {
    const dirWatcher = fs.watch(sectionsDir, (eventType, filename) => {
      if (filename && filename.endsWith(".scss")) {
        console.log(`\n[DIRECTORY EVENT] ${eventType}: ${filename}`);
        // Re-scan and watch all files
        watchAllSectionFiles();
        // Compile immediately
        compileScss(scssPath, cssPath);
      }
    });

    dirWatcher.on("error", (err) => {
      console.error(`Directory watcher error: ${err.message}`);
    });

    console.log(`✓ Watching directory: ${sectionsDir}`);
  } catch (err) {
    console.error(`Error setting up directory watcher: ${err.message}`);
  }

  // Initial watch setup
  watchAllSectionFiles();

  // Periodically check for new files (more reliable on Windows)
  setInterval(() => {
    watchAllSectionFiles();
  }, 3000); // Check every 3 seconds for new files
}

function compileScssOnSave(scssPath, cssPath, sectionsDir) {
  console.log(`Watching ${scssPath} for changes...`);
  console.log(`Watching ${sectionsDir} directory for changes...`);

  // Watch the main SCSS file for changes
  fs.watchFile(scssPath, { interval: 500 }, (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
      console.log(`Main file changed: ${scssPath}`);
      compileScss(scssPath, cssPath);
    }
  });

  // Watch sections directory
  watchSectionsDirectory(sectionsDir, scssPath, cssPath);

  // Initial compilation
  compileScss(scssPath, cssPath);
}

// Usage:
compileScssOnSave("css/style.scss", "css/style.css", "css/sections");
