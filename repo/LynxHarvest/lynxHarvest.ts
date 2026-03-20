// lynxHarvest.ts
// Entrypoint for LynxHarvest
// Author: Marreco

import { Utils } from "./utils/utils";
import { LynxParser } from "./parsers/lynxParser";

async function runLynx(term: string) {
    Utils.printScriptHeader();
    println(`Executing Lynx Search for: ${term} - Please Wait...`);

    const outputFile = "/temp/lynxSearchTemp.txt";
    await Shell.Process.exec(`lynx ${term} > ${outputFile}`);

    const raw = await FileSystem.ReadFile(outputFile);

    await FileSystem.Remove(`${outputFile}`);
    return String(raw);
}

async function recursiveScan(term: string) {
    // create file
    const response = await runLynx(term);
    const parsed = await LynxParser.parseOutput(response, term);

    println("\n=== Results for: " + term + " ===");
    println(JSON.stringify(parsed, null, 2));

    // read temp folder
    const files = await FileSystem.ReadDir("temp");

    if (!files) {
        println("no files");
    } else {
        println("yes files: " + files.length);
    }
}

async function main() {
    Utils.printScriptHeader();

    // Set default folder
    const folderInfo = await FileSystem.cwd();
    await FileSystem.SetPath(folderInfo.absolutePath, { absolute: true });

    let term = await prompt("Enter search term: ");
    Shell.lock();

    if (term.length == 0) term = "rob steal";

    const results = await recursiveScan(term);
}

await main();

println("Ending...");
if (Shell.isLocked()) Shell.unlock();
