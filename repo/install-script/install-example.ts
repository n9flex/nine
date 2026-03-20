const info = await FileSystem.cwd(); //! Don't Change This Line
/**
 * Installation Script Configuration Section
 */
const ART = `
                   __   
    _____ ________/  |_ 
    \\__  \\\\_  __ \\   __\\
     / __ \\|  | \\/|  |  
    (____  /__|   |__|  
         \\/             
`;
const CREDITS = '     Example Installer\n';
const appDescription = 'Example Install Tool'
const promptForNewFilename = 'Enter a new name (No spaces/symbols) or Press Enter to abort: ';

const enableFakeLoading = true; // Print lines to give appearance of loading
const enableArtAndCredits = true; // Show ASCII Art
const enableFakeLoadingDelay = true; // Enable or Disable sleep delays
const entryPointFunctionName = 'initializeEntryPoint'; // Main Function which initializes your main script
const scriptCommandName = `example`; // This will be the name of the file in /root/lib (e.g example.ts)
const entryFilename = `core`; // The name your main function is in without the extension
const scriptLocation = info.absolutePath;
/**
 * END of Installation Script Configuration Section
 * Edit below this at your risk
 */


install();


async function install() {

    if (enableArtAndCredits) {
        println({ text: ART, color: "#00f2ff" });
        println({ text: CREDITS, color: "gray" });
    }

    if (enableFakeLoading) {
        println({ text: "[*] Initializing build systems...", color: "#555555" });
        if (enableFakeLoadingDelay) await sleep(600);
        println({ text: "[*] Checking configuration...", color: "#555555" });
        if (enableFakeLoadingDelay) await sleep(400);
    }
    
    let config = await fileExists(scriptLocation, `${scriptCommandName}.dat`, true);

    if (!config) {
        const defaultConfig = { firstRun: true };
        await FileSystem.WriteFile(`${scriptLocation}/${scriptCommandName}.dat`, JSON.stringify(defaultConfig), { absolute: true });
        config = defaultConfig;
        println({ text: `[+] New ${scriptCommandName}.dat generated.`, color: "#a6ff00" });
    }

    if (enableFakeLoadingDelay) await sleep(400);
    if (enableFakeLoading) println({ text: "[*] Verifying environment paths...", color: "#555555" });
    
    let targetName = scriptCommandName;
    let isPathClear = false;

    while (!isPathClear) {
        const shortcutExists = await fileExists("lib", `${targetName}.ts`);

        if (shortcutExists) {
            println({ text: `[!] CONFLICT: '${targetName}' shortcut already exists.`, color: "#ffcc00" });
            println({ text: `   > Choose a new name or remove '/root/lib/${targetName}.ts'`, color: "#ffcc00" });
            const answer = await prompt(`${promptForNewFilename}`);
            
            if (!answer) {
                println({ text: "[*] Installation aborted by user.", color: "#ff4d4d" });
                return;
            }
            targetName = answer;
        } else {
            isPathClear = true;
        }
    }

    await FileSystem.WriteFile(`lib/${targetName}.ts`, `/**\n * @app-description ${appDescription}\n */\nimport { ${entryPointFunctionName} } from "..${scriptLocation}/${entryFilename}";\nconst args = Shell.GetArgs();\nawait ${entryPointFunctionName}(args, '${scriptLocation}');`, { absolute: true });
    
    if (config.firstRun === true) {
        config.firstRun = false;
        await FileSystem.WriteFile(`${scriptLocation}/${scriptCommandName}.dat`, JSON.stringify(config), { absolute: true });
    }

    println({ text: `[+] Global shortcut '${targetName}' registered.`, color: "#a6ff00" });

    if (enableFakeLoadingDelay) await sleep(800);
    println(" ");
    println({ text: "--------------------------------------------------", color: "#555555" });
    println({ text: "SUCCESS: Installation complete.", color: "#a6ff00" });
    println({ text: `You can now run the tool by typing '${targetName}'`, color: "white" });
    println({ text: "--------------------------------------------------", color: "#555555" });
}

async function fileExists(folderPath: string, fileName: string, readToVariable = false): Promise<any> {
    const files = await FileSystem.ReadDir(folderPath, { absolute: true });
    if (!files) return false;

    const exists = files.some(f => `${f.name}.${f.extension}` === fileName);

    if (exists && readToVariable) {
        const content = await FileSystem.ReadFile(`${folderPath}/${fileName}`, { absolute: true });
        try {
            return JSON.parse(content);
        } catch (e) {
            return content;
        }
    }
    return exists;
  }