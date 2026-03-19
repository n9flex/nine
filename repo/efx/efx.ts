/**
 * EFX Toolkit
 * @app-description Email-to-IP recon, auto-exploitation, and JWT decryption.
 */

const ART = `
 __________________________  ___
 \\_   _____/\\_   _____/\\   \\/  /
  |    __)_  |    __)   \\     / 
  |        \\ |     \\    /     \\ 
 /_______  / \\___  /   /___/\\  \\
         \\/      \\/          \\_/
`;

const CREDIT = `
        EFX Toolkit v1.1
      Email & JWT Processor
        Created by Empasm
`;

const args = Shell.GetArgs();
let isEmail = false;
let autoMode = false;
let inputVal = "";

const usage = () => {
    println({ text: "\nCOMMAND OPTIONS:", color: "gray" });
    println({ text: "-----------------------------------------", color: "#555555" });
    
    println({ text: "  -h --help      Show this information", color: "#00f2ff" });
    println({ text: "  -e --email     Search email address", color: "#00f2ff" });
    println({ text: "  -a --auto      Automated selections", color: "#00f2ff" });
    
    println({ text: "-----------------------------------------", color: "#555555" });
    println({ text: "\n  EXAMPLES:", color: "gray" });
    
    println({ text: "    efx -h", color: "#a6ff00" });
    println({ text: "    efx -e some@email.com", color: "#a6ff00" });
    println({ text: "    efx -e some@email.com -a", color: "#a6ff00" });
    println({ text: "    efx <jwt_token>", color: "#a6ff00" });
    
    println({ text: "-----------------------------------------\n", color: "#555555" });
};

println({ text: ART, color: "#00f2ff" });
println({ text: CREDIT, color: "gray" });

if (!args[0] || args.includes("-h") || args.includes("--help") || args.includes("?")) {
    usage();
    return;
}

for (let i = 0; i < args.length; i++) {
    if (args[i] === "-e" || args[i] === "--email") {
        isEmail = true;
        inputVal = args[i + 1];
        i++;
    } else if (args[i] === "-a" || args[i] === "--auto") {
        autoMode = true;
    } else if (!args[i].startsWith("-")) {
        inputVal = args[i];
    }
}

if (isEmail && inputVal) {
    println({ text: `\n[*] Initiating WHOIS lookup for: ${inputVal}`, color: "#555555" });
    
    await Shell.Process.exec(`whois ${inputVal} > m32.txt`);
    const whoisData = await FileSystem.ReadFile("m32.txt");
    const ipMatch = whoisData.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);

    if (!ipMatch) {
        println({ text: "[!] ERROR: No IP address found in records.", color: "#ff0033" });
    } else {
        const targetIP = ipMatch[0];
        println({ text: `[+] Target Identified: ${targetIP}`, color: "#a6ff00" });
        await FileSystem.Remove("m32.txt");

        println({ text: "[*] Initializing port scan...", color: "#555555" });
        await checkPorts(targetIP);
    }

} else if (inputVal && inputVal.split('.').length === 3) {
    println({ text: "\n[*] Valid JWT Detected. Decoding...", color: "#00f2ff" });
    println({ text: `[>] Token: ${inputVal.substring(0, 20)}...`, color: "gray" });
    
    runJWT(inputVal);

} else {
    println({ text: "[!] Invalid input format or missing arguments.", color: "#ff4d4d" });
    println({ text: "Use -h for usage examples.", color: "gray" });
}

async function checkPorts(ip) {
    if (!Networking.IsIp(ip)) {
        println({ text: "[!] ERROR: Invalid IP address format.", color: "#ff0033" });
        return;
    }

    const priorityServices = ["apache", "openssh"];

    println({ text: `[*] Connecting to subnet: ${ip}...`, color: "#555555" });
    const subnet = await Networking.GetSubnet(ip);
    if (!subnet) {
        println({ text: "[!] ERROR: Subnet unreachable.", color: "#ff0033" });
        return;
    }

    const portNumbers = await subnet.GetPorts();
    if (!portNumbers.length) {
        println({ text: "[?] No open ports found.", color: "#ffcc00" });
        return;
    }

    let ports = [];
    for (const portNumber of portNumbers) {
        const port = await subnet.GetPortData(portNumber);
        if (!port) continue;

        const isOpen = await subnet.PingPort(portNumber);
        if (isOpen) {
            let svc = port.service || "Unknown";
            let ver = port.version || "1.0";

            if (ver.includes(" ")) {
                const parts = ver.split(" ");
                svc = parts[0];
                ver = parts[1];
            }

            ports.push({ port: portNumber, service: svc, version: ver });
        }
    }

    println(" ");
    println({ text: "ID  PORT   SERVICE          VERSION", color: "gray" });
    println({ text: "--------------------------------------------------", color: "#555555" });

    ports.forEach((p, i) => {
        const id = i.toString().padEnd(4);
        const portNum = p.port.toString().padEnd(7);
        const service = p.service.substring(0, 15).padEnd(17);
        const version = p.version;

        println([
            { text: id, color: "#d2d2d2" },
            { text: portNum, color: "#a6ff00" },
            { text: service, color: "#d2d2d2" },
            { text: version, color: "white" }
        ]);
    });
    println({ text: "--------------------------------------------------", color: "#555555" });

    let target;

    if (autoMode) {
        for (const serviceName of priorityServices) {
            const found = ports.find(p => p.service.toLowerCase().includes(serviceName.toLowerCase()));
            if (found) {
                target = found;
                println({ text: `\n[+] AUTO-MODE: Priority match found (${serviceName}). Selecting...`, color: "#a6ff00" });
                break;
            }
        }
        if (!target && ports.length > 0) {
            target = ports[0];
            println({ text: `\n[*] AUTO-MODE: No priority match. Selecting ID 0 by default.`, color: "#00f2ff" });
        }
    } else {
        const choice = await prompt('\nSELECT PORT ID TO EXPLOIT: ');
        target = ports[parseInt(choice)];
    }

    if (target) {
        println({ text: `\n[*] Attempting to find and initialize metasploit...`, color: "gray" });
        
        await requireTool('metasploit')
            .then(r => println({ text: `    [+] ${r}`, color: "#a6ff00" }))
            .catch(e => println({ text: `[!] Tool Error: ${e}`, color: "#ff0033" }));

        println({ text: `\n[*] ATTACKING: ${target.service} (${target.version}) ON ${ip}:${target.port}`, color: "gray" });
        
        msf(target.service, ip, target.port.toString(), target.version);
    } else {
        println({ text: "[*] Invalid selection. Exiting...", color: "gray" });
    }
}

function msf(search, ipAddress, port, version) {
    const metasploit = GetMetasploit();
    
    metasploit.Search(search).then(async r => {
        if (r.length === 0) {
            println({ text: "[!] No exploits found for this service.", color: "#ff0033" });
            return;
        }

        println(" ");
        println({ text: "ID  NAME                             RANK      CHECK", color: "gray" });
        println({ text: "------------------------------------------------------------", color: "#555555" });

        r.forEach((obj, index) => {
            const id = index.toString().padEnd(4);
            const name = (obj.name || "Unknown").substring(0, 31).padEnd(33);
            const rank = (obj.rank || "normal").padEnd(10);
            const check = obj.check ? "Yes" : "No";

            println([
                { text: id, color: "#d2d2d2" },
                { text: name, color: "#a6ff00" },
                { text: rank, color: "white" },
                { text: check, color: "#00f2ff" }
            ]);
        });
        println({ text: "------------------------------------------------------------", color: "#555555" });

        let id;

        if (autoMode) {
            println({ text: "\n[*] AUTO-MODE: Selecting first available exploit (#0)", color: "#00f2ff" });
            id = "0";
        } else {
            id = await prompt('\nSELECT EXPLOIT ID: ');
        }

        const selection = r[parseInt(id)];

        if (!selection) {
            println({ text: "[*] Invalid selection. Aborting...", color: "gray" });
            return;
        }

        println({ text: `\n[*] LOADING: ${selection.name}`, color: "#00f2ff" });
        
        await metasploit.Use(`${selection.name}`);
        await metasploit.SetOption('RHOST', `${ipAddress}`);
        await metasploit.SetOption('RPORT', `${port}`);
        await metasploit.SetOption('Version', `${version}`);
        
        println({ text: "[*] Executing exploit payload...", color: "#ff4d4d" });
        await metasploit.Exploit();
    });
}

async function runJWT(token) {
    const tempFile = "terminalbad.txt";

    const isPresent = await fileExists(`jwt_decoder.py`);

    if (!isPresent) {
        println({ text: `[*] jwt_decoder.py not found.`, color: "gray" });
        println({ text: `   > Downloading from HackDB...`, color: "#555555" });
        const info = await FileSystem.cwd();

        await HackDB.DownloadExploit("jwt-decoder", info.absolutePath, {
            absolute: true
        });

        println([
            { text: "   > ", color: "#555555" },
            { text: "Download complete.", color: "#a6ff00" }
        ]);
    }

    println({ text: `[*] Decoding JWT...`, color: "#00f2ff" });
    
    await requireTool('python3')
        .then(r => println({ text: `    [+] ${r}`, color: "#a6ff00" }))
        .catch(e => println({ text: `[!] Tool Error: ${e}`, color: "#ff0033" }));

    await Shell.Process.exec(`python3 jwt_decoder.py ${token} > ${tempFile}`);
    
    const content = await FileSystem.ReadFile(tempFile);
    const passMatch = content.match(/"password":\s*"([^"]+)"/);

    if (passMatch && passMatch[1]) {
        const password = passMatch[1];
        
        println(" ");
        println({ text: "TYPE      DATA", color: "gray" });
        println({ text: "--------------------------------------------------", color: "#555555" });
        
        println({ text: `PASS:     ${password}`, color: "#a6ff00" });
        
        println({ text: "--------------------------------------------------", color: "#555555" });
    } else {
        println({ text: "[?] Pattern Match Failed: Password not found in output.", color: "#ffcc00" });
    }

    await FileSystem.Remove(tempFile).catch(() => {});
}

async function fileExists(fileName) {
    const files = await FileSystem.ReadDir(".");
    if (!files) throw "Cannot access directory!";
    return files.some(f => `${f.name}.${f.extension}` === fileName);
}

function requireTool(tool: string) {
    return new Promise(async (resolve, reject) => {
        const installed = checkLib(`${tool}`);
        if (!installed) {
            println(`${tool} is not installed, attempting to install now...`);
            const toolInstall = await installLib(`${tool}`);
            if (toolInstall) {
                resolve(`${tool} has been installed.`);
            } else {
                reject(`Unknown Error while installing ${tool}`);
            }
        }
        resolve(`${tool} is installed..`);
    });
}