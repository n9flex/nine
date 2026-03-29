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
  name: "geoip",
  command: "geoip",
  description: "Geolocation IP lookup",
  requires: [],
  inputs: ["ip"],
  outputs: ["geolocation"],
};

// ============================================================================
// SECTION 3: Helper Functions
// ============================================================================

/**
 * Resolves target IPs from args or mission assets
 */
function resolveTargets(mission: MissionManifest, args?: string[]): string[] {
  if (args && args.length > 0) {
    return args;
  }
  // Default: use all mission IP assets
  return mission.assets.ips.map(ip => ip.value);
}

/**
 * GeoIP data structure
 */
interface GeoIPData {
  ip: string;
  country?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  isp?: string;
}

/**
 * Executes geoip command and parses output
 */
async function performGeoIPLookup(ip: string): Promise<GeoIPData | null> {
  const tempFile = "./tmp/geoip_output.txt";
  
  // Ensure temp directory exists
  try {
    await FileSystem.Mkdir("./tmp", { absolute: false });
  } catch {
    // Directory might already exist
  }

  try {
    // Try geoip command first
    await Shell.Process.exec(`geoip ${ip} > ${tempFile}`);
    const output = await FileSystem.ReadFile(tempFile, { absolute: false });
    
    // Cleanup
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
    
    return parseGeoIPOutput(output, ip);
  } catch {
    // Cleanup on error
    try {
      await FileSystem.Remove(tempFile, { absolute: false });
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}

/**
 * Parses geoip command output
 */
function parseGeoIPOutput(output: string, ip: string): GeoIPData | null {
  const lines = output.split("\n").map(l => l.trim()).filter(l => l);
  
  const result: GeoIPData = { ip };
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Country
    if (lowerLine.includes("country:") || lowerLine.includes("pays:")) {
      const match = line.match(/(?:country|pays)[\s:]+(.+)/i);
      if (match) result.country = match[1].trim();
    }
    
    // City
    else if (lowerLine.includes("city:") || lowerLine.includes("ville:")) {
      const match = line.match(/(?:city|ville)[\s:]+(.+)/i);
      if (match) result.city = match[1].trim();
    }
    
    // Region/State
    else if (lowerLine.includes("region:") || lowerLine.includes("state:") || lowerLine.includes("région:")) {
      const match = line.match(/(?:region|state|région)[\s:]+(.+)/i);
      if (match) result.region = match[1].trim();
    }
    
    // ISP/Org
    else if (lowerLine.includes("isp:") || lowerLine.includes("org:") || lowerLine.includes("organization:")) {
      const match = line.match(/(?:isp|org|organization)[\s:]+(.+)/i);
      if (match) result.isp = match[1].trim();
    }
    
    // Coordinates (lat/lon)
    else if (lowerLine.includes("latitude:") || lowerLine.includes("lat:")) {
      const match = line.match(/(?:latitude|lat)[\s:]+(-?\d+\.?\d*)/i);
      if (match) result.latitude = parseFloat(match[1]);
    }
    else if (lowerLine.includes("longitude:") || lowerLine.includes("lon:")) {
      const match = line.match(/(?:longitude|lon|long)[\s:]+(-?\d+\.?\d*)/i);
      if (match) result.longitude = parseFloat(match[1]);
    }
  }
  
  return result.country || result.city ? result : null;
}

// ============================================================================
// SECTION 4: Core Logic
// ============================================================================

export async function run(
  mission: MissionManifest,
  ui: UI,
  args?: string[]
): Promise<ModuleResult> {
  const targets = resolveTargets(mission, args);

  if (targets.length === 0) {
    ui.error("No target IP specified");
    return { success: false, data: { error: "No target" } };
  }

  const results: GeoIPData[] = [];

  for (const target of targets) {
    if (!Networking.IsIp(target)) {
      ui.error(`Invalid IP: ${target}`);
      continue;
    }

    ui.info(`Looking up geolocation for ${target}...`);

    try {
      const geoData = await performGeoIPLookup(target);
      
      if (!geoData) {
        ui.warn(`No geolocation data found for ${target}`);
        continue;
      }

      ui.success(`Location: ${geoData.city || "Unknown"}, ${geoData.country || "Unknown"}`);
      if (geoData.country) {
        ui.print("Country", geoData.country, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.cyan });
      }
      if (geoData.city) {
        ui.print("City", geoData.city, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.cyan });
      }
      if (geoData.region) {
        ui.print("Region", geoData.region, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.cyan });
      }
      if (geoData.isp) {
        ui.print("ISP", geoData.isp, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.cyan });
      }
      if (geoData.latitude !== undefined && geoData.longitude !== undefined) {
        ui.print("Coordinates", `${geoData.latitude}, ${geoData.longitude}`, { label: COLOR_PALETTE.gray, value: COLOR_PALETTE.purple });
      }

      results.push(geoData);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      ui.error(`GeoIP lookup failed for ${target}: ${error}`);
    }
  }

  return {
    success: results.length > 0,
    data: {
      locations: results,
      lookedUpAt: new Date().toISOString(),
    },
    newAssets: [], // GeoIP doesn't create new assets
  };
}

// ============================================================================
// SECTION 5: Default Export
// ============================================================================
export default { meta, run };
