/**
 * WiFi Auditor
 * @app-description Scan and deauth networks with a clean UI
 */

const ART = `
  __      __  ___________ ____  ___
 /  \\    /  \\ \\_   _____/ \\   \\/  /
 \\   \\/\\/   /  |    __)    \\     / 
  \\        /   |     \\     /     \\ 
   \\__\/\\  /    \\___  /    /___/\\  \\
        \\/         \\/           \\_/
`;

const CREDIT = `
        WFX_WIFI_AUDITOR v1.2
         Styled by Empasm
`;

println({ text: ART, color: "#00f2ff" });
println({ text: CREDIT, color: "gray" });

println({ text: "\n[*] Booting Wireless Systems...", color: "#555555" });
const ifaces = await Networking.Wifi.GetInterfaces();
const mon = ifaces.find(i => i.monitor);

if (!mon) {
    println({ text: "[!] ERROR: No monitor mode interface found.", color: "#ff0033" });
    return;
}

println({ text: `[+] Using Interface: ${mon.name}`, color: "#a6ff00" });
println({ text: "[*] Scanning for nearby networks...", color: "#555555" });
await sleep(400);

const networks = await Networking.Wifi.Scan(mon.name);

if (networks.length === 0) {
    println({ text: "[?] No networks found.", color: "#ffcc00" });
    return;
}

println(" ");
println({ text: "ID  BSSID              SIGNAL  SSID", color: "gray" });
println({ text: "--------------------------------------------------", color: "#555555" });

networks.forEach((n, i) => {
    const id = i.toString().padEnd(3);
    const bssid = n.bssid.padEnd(18);
    const signal = `[${n.signal}]`.padEnd(7);
    const ssid = n.ssid;
    
    let rowColor = "#d2d2d2";
    if (n.signal >= 3) rowColor = "#a6ff00";
    if (n.signal === 0) rowColor = "#ff4d4d";

    println({ text: `${id} ${bssid} ${signal} ${ssid}`, color: rowColor });
});
println({ text: "--------------------------------------------------", color: "#555555" });

const mode = await prompt('\n[1] SINGLE TARGET | [2] ATTACK ALL | [Any] EXIT: ');

if (mode === "1") {
    const choice = await prompt('SELECT NETWORK ID TO ATTACK: ');
    const target = networks[parseInt(choice)];

    if (!target) {
        println({ text: "[*] Exiting...", color: "gray" });
        return;
    }

    println({ text: `\n[*] TARGETING: ${target.ssid} (${target.bssid})`, color: "#00f2ff" });
    println({ text: "    > Sending Deauth packets...", color: "#555555" });
    await Networking.Wifi.Deauth(mon.name, target.bssid);

    println({ text: "    > Capturing WPA Handshake...", color: "#555555" });
    const pcap = await Networking.Wifi.CaptureHandshake(mon.name, target.bssid);

    if (pcap) {
        println({ text: "[+] Handshake Captured. Initializing Crack...", color: "#a6ff00" });
        const password = await Crypto.Hashcat.Decrypt(pcap);
        
        println(" ");
        println({ text: "SIGNAL  BSSID              SSID               KEY", color: "gray" });
        println({ text: "----------------------------------------------------------------------", color: "#555555" });
        
        const sig = `[${target.signal}]`.padEnd(8);
        const bssid = target.bssid.padEnd(19);
        const ssid = target.ssid.substring(0, 17).padEnd(19);
        
        println([
            { text: sig, color: "#a6ff00" },
            { text: bssid, color: "#d2d2d2" },
            { text: ssid, color: "#a6ff00" },
            { text: password, color: "white" }
        ]);
        
        println({ text: "----------------------------------------------------------------------", color: "#555555" });

        await FileSystem.Remove(pcap).catch(() => {});
    } else {
        println({ text: "[!] Failed to capture handshake.", color: "#ff0033" });
    }
} else if (mode === "2") {
    println({ text: `\n[*] INITIALIZING BATCH ATTACK ON ${networks.length} NETWORKS...`, color: "#00f2ff" });

    const results = [];
    const attackPromises = networks.map(async (target) => {
        try {
            await Networking.Wifi.Deauth(mon.name, target.bssid);
            const pcap = await Networking.Wifi.CaptureHandshake(mon.name, target.bssid);
            if (!pcap) return;

            const password = await Crypto.Hashcat.Decrypt(pcap);

            results.push({ ssid: target.ssid, bssid: target.bssid, key: password, signal: target.signal });

            await FileSystem.Remove(pcap).catch(() => {});
        } catch (e) {}
    });

    await Promise.all(attackPromises);

    if (results.length > 0) {
        results.sort((a, b) => b.signal - a.signal);

        println(" ");
        println({ text: "SIGNAL  BSSID              SSID               KEY", color: "gray" });
        println({ text: "----------------------------------------------------------------------", color: "#555555" });
        
        results.forEach(res => {
            const sig = `[${res.signal}]`.padEnd(8);
            const bssid = res.bssid.padEnd(19);
            const ssid = res.ssid.substring(0, 17).padEnd(19);

            println([
                { text: sig, color: res.signal >= 3 ? "#a6ff00" : "#d2d2d2" },
                { text: bssid, color: "#d2d2d2" },
                { text: ssid, color: "#a6ff00" },
                { text: res.key, color: "white" }
            ]);
        });
        
        println({ text: "----------------------------------------------------------------------\n", color: "#555555" });

        const saveChoice = await prompt('\nSAVE RESULTS TO FILE? (y/n): ');
        if (saveChoice.toLowerCase() === 'y') {
            const logName = `wfx_${Date.now()}.txt`;
            const data = results.map(r => `[${r.signal}] ${r.ssid} | ${r.bssid} | ${r.key}`).join('\n');
            await FileSystem.WriteFile(logName, data);
            println({ text: `[+] Results saved to ${logName}`, color: "#a6ff00" });
        }
    } else {
        println({ text: "\n[!] NO KEYS RECOVERED.", color: "red" });
    }
} else {
    println({ text: "[*] Exiting...", color: "gray" });
}