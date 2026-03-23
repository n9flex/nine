/**
 * Virtual Extractor made by Empasm
 * @app-description Extract data from files to save or scan automatically
 */
const args = Shell.GetArgs()

const ART = `
 ____  ____             
 \\   \\/   /____ ___  ___
  \\   Y   // __ \\\\  \\/  /
   \\     /\\  ___/ >    < 
    \\___/  \\___  >__ /\\_ \\
               \\/      \\/
`;

const CREDIT = `
   VIRTUAL_EXTRACTOR v1.0
     Created by Empasm

`;

println({ text: ART, color: "#00f2ff" });
println({ text: CREDIT, color: "gray" });

println({ text: "[*] Booting VEX systems...", color: "#555555" });
await sleep(800); 

println({ text: "[*] Connecting to FileSystem...", color: "#555555" });
await sleep(600);

println({ text: "[+] Connection Established.", color: "#a6ff00" });
await sleep(400);

println(" "); 

println({ text: "--- AVAILABLE MODULES ---", color: "white" });
println({ text: "1) Emails\n2) Names\n3) Web Addresses\n4) Direct File Scan (Lynx All)\n", color: "#d2d2d2" });
println({ text: "-------------------------\n0) Exit VeX", color: "gray" });
println(" ");

let moduleType: any = null;
let choice = "";
let isValid = false;

while (!isValid) {
    choice = await prompt('SELECT MODULE [1-4, 0 to Exit]: ');

    if (choice === "1") {
        moduleType = { id: 1, name: "EMAILS" };
        isValid = true;
    } else if (choice === "2") {
        moduleType = { id: 2, name: "NAMES" };
        isValid = true;
    } else if (choice === "3") {
        moduleType = { id: 3, name: "WEB ADDRESSES" };
        isValid = true;
    } else if (choice === "4") {
        moduleType = { id: 4, name: "DIRECT" };
        isValid = true;
    } else if (choice === "0") {
        println({ text: "[*] Exiting VeX...", color: "#ff4d4d" });
        return;
    } else {
        println({ text: "[!] WARNING: INVALID SELECTION\n", color: "#ffcc00" });
        println({ text: "Please enter 1, 2, 3, 4, or 0", color: "gray" });
        println(" "); 
    }
}

const path = await prompt(`ENTER TARGET PATH FOR ${moduleType.name}: `);

println({ text: `\n[*] INITIALIZING ${moduleType.name} SCAN ON: ${path}`, color: "#555555" });
await sleep(1000);

const PATTERNS: Record<number, RegExp> = {
    1: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    2: /\b([A-Z][a-z-]+[ ]+[A-Z][a-z-]+)\b/g,
    3: /(https?:\/\/[^\s$.?#].[^\s]*)|(www\.[^\s$.?#].[^\s]*)/gi
};

const results = await vexScanner(path, moduleType.id);

if (results.length > 0) {
    if (moduleType.id === 4) {
        println({ text: `[+] Loaded ${results.length} lines for processing.`, color: "#a6ff00" });
        await lynxScanningTool(results, true);
    } else {
        println({ text: `[+] SUCCESS: Extracted ${results.length} items.`, color: "#a6ff00" });
        println({ text: "--------------------------------------------------", color: "#555555" });
        for (const item of results) {
            println({ text: `  >> ${item}`, color: "#00f2ff" });
        }
        println({ text: "--------------------------------------------------", color: "#555555" });
        await lynxScanningTool(results);
    }
} else {
    println({ text: "\n[?] Scan yielded no data.", color: "#555555" });
}

async function vexScanner(filePath: string, mode: number): Promise<string[]> {
    try {
        const content = await FileSystem.ReadFile(filePath);
        
        if (!content) {
            println({ text: `[!] ERROR: Cannot read ${filePath}`, color: "#ff0033" });
            return [];
        }

        if (mode === 4) {
            return content.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
        }

        const regex = PATTERNS[mode];
        
        if (!regex) {
            println({ text: `[!] ERROR: Invalid pattern ID ${mode}`, color: "#ff0033" });
            return [];
        }

        const matches = content.match(regex);

        if (!matches) {
            println({ text: "[-] No matches found in target.", color: "#ffcc00" });
            return [];
        }

        return Array.from(new Set(matches));

    } catch (err) {
        println({ text: `[!] System Crash: ${err}`, color: "#ff0033" });
        return [];
    }
}

async function lynxScanningTool(targets: string[], forceScan: boolean = false) { 
    let lynxChoice = "";

    if (forceScan) {
        lynxChoice = "1"; 
    } else {
        println({ text: "\n--- SCAN WITH LYNX? ---", color: "white" });
        println({ text: "1) Yes\n2) No\n", color: "#d2d2d2" });
        println({ text: "-----------------------\n0) Exit VeX", color: "gray" });
        println(" ");
        lynxChoice = await prompt('SELECT CHOICE [1, 2, 0 to Exit]: ');
    }

    if (lynxChoice === "0") return;
    if (lynxChoice === "2") {
        println({ text: "[*] Skipping Lynx Scan.", color: "gray" });
        return;
    }

    await requireTool('lynx').then(r => {
        println({ text: `${r}`, color: "#a6ff00" });
    }).catch(e => {
        println({ text: `${e}`, color: "#ff0033" });
        return;
    });

    for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        const isFirst = (i === 0);
        const modeText = isFirst ? "Creating" : "Appending";
        
        println({ text: `[*] ${modeText} vex-results.txt with ${target} (${i+1}/${targets.length})`, color: "gray" });
        println({ text: "    > Initializing network request...", color: "#555555" });

        if (isFirst) {
            await Shell.Process.exec(`lynx ${target} > vex-results.txt`);
        } else {
            await Shell.Process.exec(`lynx ${target} >> vex-results.txt`);
        }

        println({ text: "    [OK] Content Cached.", color: "#a6ff00" }); 
    }

    println({ text: "\n[+] Processing complete. Results saved to vex-results.txt", color: "gray" });
    println({ text: "    > Initializing Data Scrub...", color: "#555555" });

    await cleanupResults("vex-results.txt");
    println({ text: "[+] VeX Session Complete.", color: "white" });
}

async function cleanupResults(filePath: string) {
    try {
        const rawContent = await FileSystem.ReadFile(filePath);
        if (!rawContent) return;

        //Clear file while waiting for processing
        await Shell.Process.exec(`echo "--- NO INTEL FOUND ---" > ${filePath}`);

        const blocks = rawContent.split(/LYNX - Information Gathering Tool/);
        let firstWrite = true;

        for (const block of blocks) {
            const lines = block.split('\n');
            let usefulLines: string[] = [];
            let targetName = "";

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const nextLine = (lines[i + 1] || "").trim();

                if (line.startsWith("Target:")) {
                    targetName = line.replace("Target: ", "");
                    continue;
                }

                const isHeader = line.endsWith(":") || line.endsWith("...");
                const nextLineHasData = nextLine !== "" && !nextLine.includes("No data found.");

                if (isHeader && nextLineHasData) {
                    usefulLines.push(line);
                } else if (!isHeader && line !== "" && !line.includes("No data found.") && !line.includes("Version:")) {
                    usefulLines.push(line);
                }
            }

            if (usefulLines.length > 0) {
                const scrubbedBlock = `[!] INTEL FOUND FOR ${targetName}:\n` + usefulLines.join('\n');
                const op = firstWrite ? ">" : ">>";
                const prefix = firstWrite ? "" : "\\n\\n------------------------------\\n\\n";
                
                await Shell.Process.exec(`echo "${prefix}${scrubbedBlock}" ${op} ${filePath}`);
                firstWrite = false;
            }
        }
        println({ text: "    > Data Scrubbing Complete...", color: "#a6ff00" });
    } catch (err) {
        println({ text: `[!] Scrubbing Failed: ${err}`, color: "red" });
    }
}

function requireTool(tool: string) {
    return new Promise(async (resolve, reject) => {
        println({ text: `[*] Checking if ${tool} is installed`, color: "gray" });
        const installed = checkLib(`${tool}`);
        if (!installed) {
            println({ text: `    > ${tool} is not installed, attempting install now ...`, color: "#555555" });
            const toolInstall = await installLib(`${tool}`);
            if (toolInstall) {
                resolve(`[+] ${tool} has been installed.`);
            } else {
                reject(`[!] Unkown Error while installing ${tool}`);
            }
        }
        resolve(`[+] ${tool} is installed..`);
    })
}