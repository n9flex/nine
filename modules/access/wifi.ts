// @ts-nocheck
// ============================================================================
// SECTION 1: Imports
// ============================================================================
import { UI, COLOR_PALETTE } from "../../lib/ui";
import { MissionManifest, ModuleResult } from "../../lib/types";

// ============================================================================
// SECTION 2: Module Metadata
// ============================================================================
export const meta = {
  name: "wifi",
  command: "wifi",
  description: "WiFi auditor - scan, crack and connect",
  requires: [],
  inputs: [],
  outputs: ["credentials", "sessions"],
};

// ============================================================================
// SECTION 3: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  ui.section("WIFI CRACKING");
  ui.info("WiFi cracking pipeline - scan, deauth, capture, crack");
  ui.divider();

  // Step 1: Get interfaces
  ui.info("Scanning network interfaces...");
  const interfaces = await Networking.Wifi.GetInterfaces();
  if (!interfaces || !interfaces.length) {
    ui.error("No network interfaces found");
    return { success: false, data: { error: "No interfaces" } };
  }

  ui.success(`Found ${interfaces.length} interface(s):`);
  interfaces.forEach((iface, i) => {
    const mode = iface.monitor ? "MONITOR" : "MANAGED";
    const color = iface.monitor ? COLOR_PALETTE.green : COLOR_PALETTE.gray;
    println([{ text: `  ${i}) ${iface.name} [${mode}]`, color }]);
  });
  ui.divider();

  const monInterface = interfaces.find(i => i.monitor);
  if (!monInterface) {
    ui.error("No monitor-mode interface found. Enable monitor mode first.");
    return { success: false, data: { error: "No monitor interface" } };
  }
  ui.success(`Using monitor interface: ${monInterface.name}`);

  // Step 2: Scan networks
  ui.info("Scanning for wireless networks...");
  const networks = await Networking.Wifi.Scan(monInterface.name);
  if (!networks || !networks.length) {
    ui.error("No wireless networks found");
    return { success: false, data: { error: "No networks" } };
  }

  ui.success(`Found ${networks.length} network(s):`);
  ui.divider();
  networks.forEach((ap, i) => {
    ui.print(String(i), ap.bssid, { label: COLOR_PALETTE.purple, value: COLOR_PALETTE.cyan });
  });
  ui.divider();

  // Step 3: Select target
  const sel = await prompt("Select network index (or 'q' to quit): ");
  if (sel.toLowerCase() === "q") {
    return { success: false, data: { error: "User cancelled" } };
  }
  const idx = parseInt(sel);
  if (isNaN(idx) || !networks[idx]) {
    ui.error("Invalid selection");
    return { success: false, data: { error: "Invalid selection" } };
  }

  const target = networks[idx];
  ui.success(`Target: ${target.bssid}`);

  // Step 4: Deauth
  ui.info("Sending deauthentication frames...");
  const deauthOk = await Networking.Wifi.Deauth(monInterface.name, target.bssid);
  if (!deauthOk) {
    ui.warn("Deauth may have failed - continuing anyway");
  } else {
    ui.success("Deauth sent");
  }

  // Step 5: Capture handshake
  ui.info("Capturing WPA handshake (this may take a moment)...");
  const pcapPath = await Networking.Wifi.CaptureHandshake(monInterface.name, target.bssid);
  if (!pcapPath) {
    ui.error("Failed to capture handshake");
    return { success: false, data: { error: "Capture failed" } };
  }
  ui.success(`Handshake captured: ${pcapPath}`);

  // Step 6: Crack with Hashcat
  ui.info("Cracking with Hashcat...");
  const password = await Crypto.Hashcat.Decrypt(pcapPath);
  
  if (password) {
    ui.divider();
    ui.success("WiFi PASSWORD CRACKED!");
    ui.divider();
    ui.print("BSSID", target.bssid, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.cyan });
    ui.print("Password", password, { label: COLOR_PALETTE.white, value: COLOR_PALETTE.green });
    ui.divider();

    return {
      success: true,
      data: { bssid: target.bssid, password, pcapPath },
      newAssets: [{
        type: "credential",
        value: { user: target.bssid, pass: password, source: "wifi-crack" },
        parent: target.bssid,
      }],
    };
  } else {
    ui.error("Hashcat could not crack the password");
    ui.info("Try a different wordlist or capture more handshakes");
    return { success: false, data: { error: "Crack failed", bssid: target.bssid } };
  }
}

// ============================================================================
// SECTION 4: Default Export
// ============================================================================
export default { meta, run };
