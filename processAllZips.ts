#!/usr/bin/env deno run --allow-read --allow-write

import JSZip from "https://esm.sh/jszip@3.10.1";
import { resolve, join } from "https://deno.land/std@0.203.0/path/mod.ts";

// Function to process a single ZIP file
async function processZip(zipPath: string, filterText: string, results: string[]) {
  console.log(`Processing ZIP file: ${zipPath}`);
  try {
    const zipData = await Deno.readFile(zipPath);
    const zip = await JSZip.loadAsync(zipData);

    // Locate all "definition.json" files in nested folders
    const files = Object.keys(zip.files).filter((fileName) =>
      fileName.endsWith("definition.json")
    );

    if (files.length === 0) {
      console.warn(`No "definition.json" files found in ${zipPath}.`);
      return;
    }

    for (const fileName of files) {
      const fileContent = await zip.files[fileName].async("string");
      if (fileContent.includes(filterText)) {
        const result = `Found matching file: ${fileName} in ZIP: ${zipPath}`;
        results.push(result);
        console.log(result);
      }
    }
  } catch (error) {
    console.error(`Error processing ${zipPath}:`, error.message);
  }
}

// Main script
async function main() {
  const folderPath = Deno.args[0];
  const filterText = Deno.args[1];

  if (!folderPath || !filterText) {
    console.error("Usage: processAllZips.ts <folderPath> <filterText>");
    Deno.exit(1);
  }

  const resolvedFolderPath = resolve(folderPath);
  const results: string[] = [];

  // Get all ZIP files in the specified directory
  for await (const dirEntry of Deno.readDir(resolvedFolderPath)) {
    if (dirEntry.isFile && dirEntry.name.endsWith(".zip")) {
      const zipPath = join(resolvedFolderPath, dirEntry.name);
      await processZip(zipPath, filterText, results);
    }
  }

  if (results.length > 0) {
    const outputPath = resolve("found.txt");
    await Deno.writeTextFile(outputPath, results.join("\n"));
    console.log(`Results saved to: ${outputPath}`);
  } else {
    console.log("No matching files found.");
  }

  console.log("All ZIP files processed.");
}

// Execute the main function
main();
