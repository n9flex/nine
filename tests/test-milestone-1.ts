/**
 * test-milestone-1.ts
 * Milestone 1: Foundation — Pragmatic E2E Test Suite
 *
 * Tests only what matters on HackHub:
 * - Real FileSystem operations (create, read, write, delete)
 * - Real Networking API where available (with mock fallback)
 * - Mission lifecycle (create → attach → scan → nettree → detach)
 * - Module runner with asset deduplication
 * - History tracking
 *
 * What we DON'T test (TypeScript does it or it's pointless):
 * - Type structure validation (typeof x === "string")
 * - Enum value existence
 * - UI method existence one-by-one
 *
 * Usage:
 *   node test-milestone-1.ts [command]
 *
 * Commands:
 *   test-storage    - FileSystem operations
 *   test-utils      - dedupeAssets logic
 *   test-mission    - Mission lifecycle
 *   test-session    - Session persistence (.current_mission)
 *   test-runner     - Module execution + asset tracking
 *   test-cli        - Full CLI flow simulation
 *   full-test       - Complete integration (recommended)
 */
// @ts-nocheck

// ============================================================================
// SECTION: HackHub API Declarations (required for runtime)
// ============================================================================

declare namespace Shell {
  function GetArgs(): string[];
}

declare namespace FileSystem {
  function cwd(): Promise<{ currentPath: string; absolutePath: string }>;
  function ReadDir(path: string, options?: { absolute?: boolean }): Promise<Array<{ name: string; isFolder: boolean; extension?: string }> | null>;
  function ReadFile(path: string, options?: { absolute?: boolean }): Promise<string>;
  function WriteFile(path: string, content: string, options?: { absolute?: boolean; recursive?: boolean }): Promise<void>;
  function Remove(path: string, options?: { absolute?: boolean; recursive?: boolean }): Promise<void>;
  function Mkdir(path: string, options?: { absolute?: boolean; recursive?: boolean }): Promise<void>;
  function SetPath(path: string, options?: { absolute?: boolean }): Promise<void>;
}

declare namespace Networking {
  function IsIp(ip: string): boolean;
  function GetSubnet(ip: string): Promise<{
    ip: string;
    lanIp: string;
    GetPorts(): Promise<number[]>;
    PingPort(port: number): Promise<boolean>;
    GetPortData(port: number): Promise<{
      service: string;
      version: string;
      external: number;
      internal: number;
      target: string;
    } | null>;
  } | null>;
}

declare function println(text: string | Array<{ text: string; color?: string }>): void;
declare function printTable(data: Array<Record<string, unknown>>): void;
declare function prompt(options: { label: string; password?: boolean }): Promise<string>;
declare function sleep(ms: number): Promise<void>;

// ============================================================================
// SECTION: Types (for development, not runtime testing)
// ============================================================================

interface PortInfo {
  port: number;
  state: "open" | "closed" | "filtered" | "forwarded";
  service: string;
  version?: string;
  forwarded?: {
    externalPort: number;
    internalPort: number;
    targetIp?: string;
  };
}

interface Seed {
  value: string;
  type: "ip" | "domain" | "email" | "cidr";
  addedAt: string;
  resolvedIp?: string;
}

interface IPAsset {
  value: string;
  status: "discovered" | "scanned" | "exploited" | "pwned";
  deviceType?: "router" | "firewall" | "printer" | "server" | "workstation" | "unknown";
  ports: PortInfo[];
  parent?: string;
  discoveredBy: string;
  discoveredAt: string;
  notes?: string;
}

interface DomainAsset {
  value: string;
  source: "seed" | "subfinder" | "lynx" | "dns";
  parent?: string;
  resolvedIp?: string;
  vulnerable?: boolean;
  discoveredAt: string;
}

interface HistoryEntry {
  timestamp: string;
  module: string;
  target?: string;
  action: string;
  result: "success" | "failure" | "partial";
  data?: unknown;
}

interface MissionManifest {
  name: string;
  created: string;
  updated: string;
  seeds: Seed[];
  assets: {
    ips: IPAsset[];
    domains: DomainAsset[];
    emails: string[];
    credentials: Array<{user: string; pass: string; source: string}>;
    hashes: string[];
    ntlmHashes: Array<{ip: string; username: string; hash: string; cracked?: string; dumpedAt: string}>;
    sessions: Array<{type: "jwt" | "cookie" | "token" | "api_key"; value: string; source: string; target: string; extractedAt: string; decoded?: unknown}>;
    files: string[];
  };
  history: HistoryEntry[];
}

interface ModuleMeta {
  name: string;
  command: string;
  description: string;
  requires: string[];
  inputs: string[];
  outputs: string[];
}

interface ModuleResult {
  success: boolean;
  data?: unknown;
  newAssets?: Array<{
    type: "ip" | "domain" | "email" | "credential" | "hash" | "session";
    value: unknown;
    parent?: string;
  }>;
}

type ModuleFunction = (
  mission: MissionManifest,
  ui: UI,
  args?: string[]
) => Promise<ModuleResult>;

// ============================================================================
// SECTION: UI System (minimal, just needs to work)
// ============================================================================

const COLOR_PALETTE = {
  white: "#ffffff",
  gray: "#6b7280",
  pink: "rgb(255, 0, 179)",
  cyan: "rgb(30, 191, 255)",
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ff4c4c",
  purple: "rgba(195, 105, 255, 0.86)",
  yellow: "#fbbf24",
} as const;

class UI {
  private static instance: UI;

  static ctx(): UI {
    if (!UI.instance) UI.instance = new UI();
    return UI.instance;
  }

  info(message: string): void {
    println({ text: `[i] ${message}`, color: COLOR_PALETTE.cyan });
  }

  success(message: string): void {
    println({ text: `[+] ${message}`, color: COLOR_PALETTE.green });
  }

  warn(message: string): void {
    println({ text: `[!] ${message}`, color: COLOR_PALETTE.orange });
  }

  error(message: string): void {
    println({ text: `[!] ${message}`, color: COLOR_PALETTE.red });
  }

  section(title: string): void {
    println({ text: "═══════════════════════════════════════════════════", color: COLOR_PALETTE.gray });
    println({ text: `  ${title}`, color: COLOR_PALETTE.cyan });
    println({ text: "═══════════════════════════════════════════════════", color: COLOR_PALETTE.gray });
  }

  divider(): void {
    println({ text: "───────────────────────────────────────────────────", color: COLOR_PALETTE.gray });
  }

  print(label: string, value?: string, colors?: { label?: string; value?: string }): void {
    if (value !== undefined) {
      println([
        { text: `${label}: `, color: colors?.label || COLOR_PALETTE.white },
        { text: value, color: colors?.value || COLOR_PALETTE.cyan },
      ]);
    } else {
      println({ text: label, color: COLOR_PALETTE.white });
    }
  }

  table(headers: string[], rows: Array<Record<string, string | number>>): void {
    if (rows.length === 0) {
      this.info("No data to display");
      return;
    }
    printTable(rows);
  }
}

// ============================================================================
// SECTION: Storage Helpers (real FileSystem operations)
// ============================================================================

async function readJson<T>(path: string, absolute = false): Promise<T | null> {
  try {
    const content = await FileSystem.ReadFile(path, { absolute });
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function writeJson<T>(path: string, data: T, absolute = false, recursive = true): Promise<boolean> {
  try {
    await FileSystem.WriteFile(path, JSON.stringify(data, null, 2), { absolute, recursive });
    return true;
  } catch {
    return false;
  }
}

async function fileExists(path: string, absolute = false): Promise<boolean> {
  try {
    await FileSystem.ReadFile(path, { absolute });
    return true;
  } catch {
    return false;
  }
}

async function deleteFile(path: string, absolute = false): Promise<boolean> {
  try {
    await FileSystem.Remove(path, { absolute });
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(path: string, absolute = false): Promise<boolean> {
  try {
    await FileSystem.Mkdir(path, { absolute, recursive: true });
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// SECTION: Utilities (business logic)
// ============================================================================

function dedupeAssets<T extends { value: string }>(
  existing: T[],
  newAssets: Array<{ type: string; value: unknown; parent?: string }>
): { unique: Array<{ type: string; value: unknown; parent?: string }>; duplicates: string[] } {
  const seen = new Set(existing.map((a) => a.value));
  const unique = newAssets.filter((a) => !seen.has(String(a.value)));
  const duplicates = newAssets.filter((a) => seen.has(String(a.value))).map((a) => String(a.value));
  return { unique, duplicates };
}

function validateIp(ip: string): boolean {
  return Networking.IsIp(ip);
}

function sanitizeMissionName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ============================================================================
// SECTION: Core Functions (Mission + Session + Runner)
// ============================================================================

const LOOT_DIR = "loot";
const CURRENT_MISSION_FILE = ".current_mission";

function getMissionDir(missionName: string, cwdAbsolute: string): string {
  return `${cwdAbsolute}/${LOOT_DIR}/${sanitizeMissionName(missionName)}`;
}

function getManifestPath(missionName: string, cwdAbsolute: string): string {
  return `${getMissionDir(missionName, cwdAbsolute)}/manifest.json`;
}

function getSessionPath(cwdAbsolute: string): string {
  return `${cwdAbsolute}/${LOOT_DIR}/${CURRENT_MISSION_FILE}`;
}

async function createManifest(missionName: string, seeds: string[], cwdAbsolute: string): Promise<MissionManifest | null> {
  const now = getCurrentTimestamp();

  const seedEntries: Seed[] = seeds.map((seed) => ({
    value: seed,
    type: Networking.IsIp(seed) ? "ip" : "domain",
    addedAt: now,
  }));

  const manifest: MissionManifest = {
    name: missionName,
    created: now,
    updated: now,
    seeds: seedEntries,
    assets: { ips: [], domains: [], emails: [], credentials: [], hashes: [], ntlmHashes: [], sessions: [], files: [] },
    history: [],
  };

  for (const seed of seedEntries) {
    if (seed.type === "ip") {
      manifest.assets.ips.push({
        value: seed.value,
        status: "discovered",
        discoveredBy: "user",
        discoveredAt: now,
        ports: [],
      });
    }
  }

  const success = await writeJson(getManifestPath(missionName, cwdAbsolute), manifest, true);
  return success ? manifest : null;
}

async function loadManifest(missionName: string, cwdAbsolute: string): Promise<MissionManifest | null> {
  return readJson<MissionManifest>(getManifestPath(missionName, cwdAbsolute), true);
}

async function saveManifest(manifest: MissionManifest, cwdAbsolute: string): Promise<boolean> {
  manifest.updated = getCurrentTimestamp();
  return writeJson(getManifestPath(manifest.name, cwdAbsolute), manifest, true);
}

interface SessionData {
  mission: string;
  attachedAt: string;
}

async function getCurrentMission(cwdAbsolute: string): Promise<string | null> {
  const data = await readJson<SessionData>(getSessionPath(cwdAbsolute), true);
  return data?.mission || null;
}

async function setCurrentMission(missionName: string, cwdAbsolute: string): Promise<boolean> {
  return writeJson(getSessionPath(cwdAbsolute), { mission: missionName, attachedAt: getCurrentTimestamp() }, true, true);
}

async function clearCurrentMission(cwdAbsolute: string): Promise<boolean> {
  return deleteFile(getSessionPath(cwdAbsolute), true);
}

async function executeModule(
  module: { meta: ModuleMeta; run: ModuleFunction },
  mission: MissionManifest,
  cwdAbsolute: string,
  args?: string[],
  ui?: UI
): Promise<ModuleResult> {
  const moduleUi = ui || UI.ctx();
  const result = await module.run(mission, moduleUi, args);

  if (result.newAssets && result.newAssets.length > 0) {
    const allExisting = [
      ...mission.assets.ips,
      ...mission.assets.domains.map((d) => ({ value: d.value })),
      ...mission.assets.emails.map((e) => ({ value: e })),
    ];

    const { unique, duplicates } = dedupeAssets(allExisting, result.newAssets);
    if (duplicates.length > 0) moduleUi.warn(`Skipped ${duplicates.length} duplicate assets`);

    for (const asset of unique) {
      const now = getCurrentTimestamp();
      switch (asset.type) {
        case "ip":
          mission.assets.ips.push({
            value: String(asset.value),
            status: "discovered",
            discoveredBy: module.meta.name,
            discoveredAt: now,
            ports: [],
            parent: asset.parent,
          });
          break;
        case "domain":
          mission.assets.domains.push({
            value: String(asset.value),
            source: module.meta.name as DomainAsset["source"],
            discoveredAt: now,
            parent: asset.parent,
          });
          break;
        case "email":
          mission.assets.emails.push(String(asset.value));
          break;
      }
    }
  }

  mission.history.push({
    timestamp: getCurrentTimestamp(),
    module: module.meta.name,
    target: args?.[0],
    action: "execute",
    result: result.success ? "success" : "failure",
    data: result.data,
  });

  await saveManifest(mission, cwdAbsolute);
  return result;
}

// ============================================================================
// SECTION: Mock Modules (realistic behavior)
// ============================================================================

const mockScannerModule = {
  meta: {
    name: "scanner",
    command: "scan",
    description: "Port scanning module",
    requires: [],
    inputs: ["ip"],
    outputs: ["ports"],
  },
  run: async (mission: MissionManifest, ui: UI, args?: string[]): Promise<ModuleResult> => {
    const target = args?.[0];
    if (!target) return { success: false, data: { error: "No target specified" } };

    ui.info(`Scanning ${target}...`);
    let ports: PortInfo[] = [];

    try {
      const subnet = await Networking.GetSubnet(target);
      if (subnet) {
        const portNumbers = await subnet.GetPorts();
        for (const port of portNumbers.slice(0, 5)) {
          const portData = await subnet.GetPortData(port);
          if (portData) {
            ports.push({ port, state: "open", service: portData.service, version: portData.version });
          }
        }
      }
    } catch {
      // Fallback mock
      ports = [
        { port: 22, state: "open", service: "ssh", version: "OpenSSH 8.2" },
        { port: 80, state: "open", service: "http", version: "nginx 1.18" },
        { port: 443, state: "open", service: "https", version: "nginx 1.18" },
      ];
    }

    ui.success(`Found ${ports.length} ports on ${target}`);
    return { success: true, data: { target, ports, scannedAt: getCurrentTimestamp() }, newAssets: [] };
  },
};

const mockNettreeModule = {
  meta: {
    name: "nettree",
    command: "nettree",
    description: "Network discovery module",
    requires: [],
    inputs: ["ip"],
    outputs: ["ips", "topology"],
  },
  run: async (mission: MissionManifest, ui: UI, args?: string[]): Promise<ModuleResult> => {
    const target = args?.[0];
    if (!target) return { success: false, data: { error: "No target specified" } };

    ui.info(`Discovering network from ${target}...`);
    const discoveredIps = ["192.168.1.10", "192.168.1.11", "192.168.1.12"];
    ui.success(`Discovered ${discoveredIps.length} new IPs`);

    return {
      success: true,
      data: { source: target, discovered: discoveredIps },
      newAssets: discoveredIps.map((ip) => ({ type: "ip" as const, value: ip, parent: target })),
    };
  },
};

// ============================================================================
// SECTION: Test Framework
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

class TestRunner {
  private results: TestResult[] = [];
  private ui = UI.ctx();

  async runTest(name: string, testFn: () => Promise<boolean>): Promise<void> {
    this.ui.info(`Testing: ${name}`);
    const start = Date.now();

    try {
      const passed = await testFn();
      const duration = Date.now() - start;
      this.results.push({ name, passed, duration });
      if (passed) this.ui.success(`PASS: ${name} (${duration}ms)`);
      else this.ui.error(`FAIL: ${name} (${duration}ms)`);
    } catch (err) {
      const duration = Date.now() - start;
      const error = err instanceof Error ? err.message : String(err);
      this.results.push({ name, passed: false, error, duration });
      this.ui.error(`ERROR: ${name} - ${error} (${duration}ms)`);
    }
  }

  getResults(): TestResult[] { return [...this.results]; }
  get passedCount(): number { return this.results.filter((r) => r.passed).length; }
  get totalCount(): number { return this.results.length; }

  printSummary(): void {
    this.ui.divider();
    const { passedCount, totalCount } = this;
    if (passedCount === totalCount) this.ui.success(`ALL TESTS PASSED: ${passedCount}/${totalCount}`);
    else {
      this.ui.error(`TESTS FAILED: ${passedCount}/${totalCount}`);
      this.ui.info("Failed tests:");
      for (const result of this.results) {
        if (!result.passed) this.ui.error(`  - ${result.name}: ${result.error || "Assertion failed"}`);
      }
    }
  }
}

// ============================================================================
// SECTION: Test Suites (Pragmatic - only what matters)
// ============================================================================

async function testUI(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();

  ui.section("TEST: lib/ui.ts");

  // Single test: UI works without crashing
  await runner.runTest("UI system functional", async () => {
    try {
      ui.info("test");
      ui.success("test");
      ui.warn("test");
      ui.error("test");
      ui.section("test");
      ui.divider();
      ui.print("test", "value");
      ui.table(["col"], [{ col: "val" }]);
      return true;
    } catch {
      return false;
    }
  });

  return runner.getResults();
}

async function testStorage(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();
  let cwdAbsolute: string;

  ui.section("TEST: lib/storage.ts");

  await runner.runTest("Get absolute path", async () => {
    const cwd = await FileSystem.cwd();
    cwdAbsolute = cwd.absolutePath;
    return typeof cwdAbsolute === "string" && cwdAbsolute.length > 0;
  });

  await runner.runTest("Write and read JSON file", async () => {
    const testData = { test: "data", number: 42, nested: { value: true } };
    const testPath = `${cwdAbsolute}/test_storage.json`;
    const written = await writeJson(testPath, testData, true);
    const read = await readJson<typeof testData>(testPath, true);
    await deleteFile(testPath, true);
    return written && read !== null && read.test === "data" && read.number === 42;
  });

  await runner.runTest("File exists check", async () => {
    const testPath = `${cwdAbsolute}/test_exists.json`;
    await writeJson(testPath, { test: true }, true);
    const existsBefore = await fileExists(testPath, true);
    await deleteFile(testPath, true);
    const existsAfter = await fileExists(testPath, true);
    return existsBefore && !existsAfter;
  });

  await runner.runTest("Create directory recursively", async () => {
    const testDir = `${cwdAbsolute}/test_nested/deep/dir`;
    const created = await ensureDir(testDir, true);
    // Verify by writing a file in the nested dir (ReadFile doesn't work on directories)
    const testFile = `${testDir}/verify.txt`;
    const written = await writeJson(testFile, { ok: true }, true);
    // Cleanup
    await FileSystem.Remove(`${cwdAbsolute}/test_nested`, { absolute: true, recursive: true });
    return created && written;
  });

  await runner.runTest("readJson with non-existent file returns null", async () => {
    const result = await readJson<unknown>(`${cwdAbsolute}/nonexistent.json`, true);
    return result === null;
  });

  return runner.getResults();
}

async function testUtils(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();

  ui.section("TEST: lib/utils.ts");

  await runner.runTest("dedupeAssets removes duplicates", async () => {
    const existing = [{ value: "192.168.1.1" }, { value: "192.168.1.2" }];
    const newAssets = [{ type: "ip", value: "192.168.1.1" }, { type: "ip", value: "192.168.1.3" }];
    const result = dedupeAssets(existing, newAssets);
    return result.unique.length === 1 && result.duplicates.length === 1;
  });

  await runner.runTest("dedupeAssets preserves unique items", async () => {
    const existing = [{ value: "192.168.1.1" }];
    const newAssets = [{ type: "ip", value: "192.168.1.2" }, { type: "ip", value: "192.168.1.3" }];
    const result = dedupeAssets(existing, newAssets);
    return result.unique.length === 2 && result.duplicates.length === 0;
  });

  await runner.runTest("validateIp with valid/invalid IPs", async () => {
    return validateIp("192.168.1.1") === true && validateIp("not-an-ip") === false;
  });

  await runner.runTest("sanitizeMissionName", async () => {
    const sanitized = sanitizeMissionName("Test Mission 123!");
    return sanitized === "Test_Mission_123_" && sanitized.length <= 50;
  });

  await runner.runTest("dedupeAssets with mixed asset types", async () => {
    const existing = [{ value: "192.168.1.1" }, { value: "admin@example.com" }];
    const newAssets = [
      { type: "ip", value: "192.168.1.1" },
      { type: "email", value: "admin@example.com" },
      { type: "domain", value: "example.com" },
    ];
    const result = dedupeAssets(existing, newAssets);
    return result.unique.length === 1 && result.duplicates.length === 2;
  });

  return runner.getResults();
}

async function testMissionManager(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();
  let cwdAbsolute: string;
  const TEST_MISSION = "TestMission_M1";

  ui.section("TEST: core/mission.ts");

  await runner.runTest("Get current working directory", async () => {
    const cwd = await FileSystem.cwd();
    cwdAbsolute = cwd.absolutePath;
    return typeof cwdAbsolute === "string";
  });

  await runner.runTest("Create mission with single seed", async () => {
    const manifest = await createManifest(TEST_MISSION, ["192.168.1.1"], cwdAbsolute);
    return manifest !== null && manifest.name === TEST_MISSION && manifest.seeds.length === 1;
  });

  await runner.runTest("Load existing manifest", async () => {
    const manifest = await loadManifest(TEST_MISSION, cwdAbsolute);
    return manifest !== null && manifest.name === TEST_MISSION;
  });

  await runner.runTest("Load non-existent manifest returns null", async () => {
    const manifest = await loadManifest("NonExistentMission", cwdAbsolute);
    return manifest === null;
  });

  await runner.runTest("Save manifest updates timestamp", async () => {
    const manifest = await loadManifest(TEST_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const originalUpdated = manifest.updated;
    await sleep(50);
    manifest.assets.ips.push({
      value: "192.168.1.2",
      status: "discovered",
      discoveredBy: "test",
      discoveredAt: getCurrentTimestamp(),
      ports: [],
    });
    const saved = await saveManifest(manifest, cwdAbsolute);
    const reloaded = await loadManifest(TEST_MISSION, cwdAbsolute);
    return saved && reloaded !== null && reloaded.updated !== originalUpdated;
  });

  await runner.runTest("Seed type detection (IP vs domain)", async () => {
    const ipManifest = await createManifest("SeedTest_IP", ["10.0.0.1"], cwdAbsolute);
    const domainManifest = await createManifest("SeedTest_Domain", ["example.com"], cwdAbsolute);
    return ipManifest?.seeds[0].type === "ip" && domainManifest?.seeds[0].type === "domain";
  });

  await runner.runTest("Multiple seeds in single mission", async () => {
    const seeds = ["192.168.1.1", "example.com", "10.0.0.1"];
    const manifest = await createManifest("MultiSeed_Test", seeds, cwdAbsolute);
    return manifest !== null && manifest.seeds.length === 3;
  });

  await runner.runTest("Load manifest with corrupted JSON returns null", async () => {
    const corruptMission = "CorruptTest_M1";
    const dir = getMissionDir(corruptMission, cwdAbsolute);
    await FileSystem.WriteFile(`${dir}/manifest.json`, "{ invalid json", { absolute: true, recursive: true });
    const manifest = await loadManifest(corruptMission, cwdAbsolute);
    await FileSystem.Remove(dir, { absolute: true, recursive: true });
    return manifest === null;
  });

  // Cleanup
  await runner.runTest("Cleanup test missions", async () => {
    const missions = [TEST_MISSION, "SeedTest_IP", "SeedTest_Domain", "MultiSeed_Test"];
    for (const mission of missions) {
      try {
        await FileSystem.Remove(getMissionDir(mission, cwdAbsolute), { absolute: true, recursive: true });
      } catch {}
    }
    return true;
  });

  return runner.getResults();
}

async function testSession(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();
  let cwdAbsolute: string;
  const TEST_MISSION = "SessionTest_M1";

  ui.section("TEST: core/session.ts");

  await runner.runTest("Get current working directory", async () => {
    const cwd = await FileSystem.cwd();
    cwdAbsolute = cwd.absolutePath;
    return typeof cwdAbsolute === "string";
  });

  await runner.runTest("Get current mission when none set", async () => {
    try {
      await clearCurrentMission(cwdAbsolute);
    } catch {}
    const current = await getCurrentMission(cwdAbsolute);
    return current === null;
  });

  await runner.runTest("Set current mission", async () => {
    const set = await setCurrentMission(TEST_MISSION, cwdAbsolute);
    const current = await getCurrentMission(cwdAbsolute);
    return set && current === TEST_MISSION;
  });

  await runner.runTest("Clear current mission", async () => {
    const cleared = await clearCurrentMission(cwdAbsolute);
    const current = await getCurrentMission(cwdAbsolute);
    return cleared && current === null;
  });

  await runner.runTest("Session with invalid JSON returns null", async () => {
    const sessionPath = getSessionPath(cwdAbsolute);
    await FileSystem.WriteFile(sessionPath, "{ invalid json", { absolute: true });
    const current = await getCurrentMission(cwdAbsolute);
    await deleteFile(sessionPath, true);
    return current === null;
  });

  return runner.getResults();
}

async function testRunner(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();
  let cwdAbsolute: string;
  const TEST_MISSION = "RunnerTest_M1";

  ui.section("TEST: core/runner.ts");

  await runner.runTest("Get current working directory", async () => {
    const cwd = await FileSystem.cwd();
    cwdAbsolute = cwd.absolutePath;
    return typeof cwdAbsolute === "string";
  });

  await runner.runTest("Execute module returns result", async () => {
    const manifest = await createManifest(TEST_MISSION, ["192.168.1.1"], cwdAbsolute);
    if (!manifest) return false;
    const result = await executeModule(mockScannerModule, manifest, cwdAbsolute, ["192.168.1.1"], ui);
    return typeof result.success === "boolean" && result.data !== undefined;
  });

  await runner.runTest("Module execution recorded in history", async () => {
    const manifest = await loadManifest(TEST_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const historyCount = manifest.history.length;
    await executeModule(mockScannerModule, manifest, cwdAbsolute, ["192.168.1.1"], ui);
    const reloaded = await loadManifest(TEST_MISSION, cwdAbsolute);
    return reloaded !== null && reloaded.history.length > historyCount;
  });

  await runner.runTest("New assets added by runner", async () => {
    const manifest = await createManifest("RunnerAssets_Test", ["10.0.0.1"], cwdAbsolute);
    if (!manifest) return false;
    const result = await executeModule(mockNettreeModule, manifest, cwdAbsolute, ["10.0.0.1"], ui);
    const reloaded = await loadManifest("RunnerAssets_Test", cwdAbsolute);
    const assetCount = reloaded?.assets.ips.length || 0;
    try {
      await FileSystem.Remove(getMissionDir("RunnerAssets_Test", cwdAbsolute), { absolute: true, recursive: true });
    } catch {}
    return result.success && assetCount >= 3;
  });

  await runner.runTest("Duplicate assets are deduplicated", async () => {
    const manifest = await createManifest("RunnerDedupe_Test", ["10.0.0.1"], cwdAbsolute);
    if (!manifest) return false;
    await executeModule(mockNettreeModule, manifest, cwdAbsolute, ["10.0.0.1"], ui);
    const updated = await loadManifest("RunnerDedupe_Test", cwdAbsolute);
    if (!updated) return false;
    const assetCountBefore = updated.assets.ips.length;
    await executeModule(mockNettreeModule, updated, cwdAbsolute, ["10.0.0.1"], ui);
    const reloaded = await loadManifest("RunnerDedupe_Test", cwdAbsolute);
    const assetCountAfter = reloaded?.assets.ips.length || 0;
    try {
      await FileSystem.Remove(getMissionDir("RunnerDedupe_Test", cwdAbsolute), { absolute: true, recursive: true });
    } catch {}
    return assetCountBefore === assetCountAfter;
  });

  await runner.runTest("Failed module execution recorded", async () => {
    const failingModule = {
      meta: { ...mockScannerModule.meta },
      run: async (): Promise<ModuleResult> => ({ success: false, data: { error: "Test failure" } }),
    };
    const manifest = await createManifest("RunnerFail_Test", ["10.0.0.1"], cwdAbsolute);
    if (!manifest) return false;
    const result = await executeModule(failingModule, manifest, cwdAbsolute, ["10.0.0.1"], ui);
    const reloaded = await loadManifest("RunnerFail_Test", cwdAbsolute);
    const lastHistory = reloaded?.history[reloaded.history.length - 1];
    try {
      await FileSystem.Remove(getMissionDir("RunnerFail_Test", cwdAbsolute), { absolute: true, recursive: true });
    } catch {}
    return !result.success && lastHistory?.result === "failure";
  });

  // Cleanup
  await runner.runTest("Cleanup test missions", async () => {
    const missions = [TEST_MISSION];
    for (const mission of missions) {
      try {
        await FileSystem.Remove(getMissionDir(mission, cwdAbsolute), { absolute: true, recursive: true });
      } catch {}
    }
    return true;
  });

  return runner.getResults();
}

async function testCLI(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();
  let cwdAbsolute: string;
  const TEST_MISSION = "CLITest_M1";

  ui.section("TEST: nine.ts CLI dispatcher");

  await runner.runTest("Get current working directory", async () => {
    const cwd = await FileSystem.cwd();
    cwdAbsolute = cwd.absolutePath;
    return typeof cwdAbsolute === "string";
  });

  await runner.runTest("Create command flow", async () => {
    const manifest = await createManifest(TEST_MISSION, ["192.168.1.100"], cwdAbsolute);
    return manifest !== null && manifest.name === TEST_MISSION;
  });

  await runner.runTest("Attach command flow", async () => {
    const manifest = await loadManifest(TEST_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const attached = await setCurrentMission(TEST_MISSION, cwdAbsolute);
    const current = await getCurrentMission(cwdAbsolute);
    return attached && current === TEST_MISSION;
  });

  await runner.runTest("Status command flow", async () => {
    const current = await getCurrentMission(cwdAbsolute);
    const manifest = current ? await loadManifest(current, cwdAbsolute) : null;
    return current === TEST_MISSION && manifest !== null;
  });

  await runner.runTest("Module execution flow", async () => {
    const current = await getCurrentMission(cwdAbsolute);
    if (!current) return false;
    const manifest = await loadManifest(current, cwdAbsolute);
    if (!manifest) return false;
    const result = await executeModule(mockScannerModule, manifest, cwdAbsolute, ["192.168.1.100"], ui);
    return result.success === true;
  });

  await runner.runTest("Detach command flow", async () => {
    const cleared = await clearCurrentMission(cwdAbsolute);
    const current = await getCurrentMission(cwdAbsolute);
    return cleared && current === null;
  });

  await runner.runTest("Create with multiple seeds", async () => {
    const seeds = ["10.0.0.1", "example.com", "192.168.1.50"];
    const manifest = await createManifest("MultiSeed_CLI_Test", seeds, cwdAbsolute);
    try {
      await FileSystem.Remove(getMissionDir("MultiSeed_CLI_Test", cwdAbsolute), { absolute: true, recursive: true });
    } catch {}
    return manifest !== null && manifest.seeds.length === 3;
  });

  // Cleanup
  await runner.runTest("Cleanup test missions", async () => {
    const missions = [TEST_MISSION, "MultiSeed_CLI_Test"];
    for (const mission of missions) {
      try {
        await FileSystem.Remove(getMissionDir(mission, cwdAbsolute), { absolute: true, recursive: true });
      } catch {}
    }
    return true;
  });

  return runner.getResults();
}

// ============================================================================
// SECTION: Full Integration Test
// ============================================================================

async function runFullIntegrationTest(): Promise<TestResult[]> {
  const runner = new TestRunner();
  const ui = UI.ctx();
  let cwdAbsolute: string;
  const INTEGRATION_MISSION = "IntegrationTest_M1";
  const SEED_IP = "211.189.37.178";

  ui.section("MILESTONE 1: FULL INTEGRATION TEST");
  ui.info("Workflow: create → attach → scan → nettree → verify → detach");

  await runner.runTest("Step 1: Create mission", async () => {
    const cwd = await FileSystem.cwd();
    cwdAbsolute = cwd.absolutePath;
    const manifest = await createManifest(INTEGRATION_MISSION, [SEED_IP], cwdAbsolute);
    return manifest !== null && manifest.name === INTEGRATION_MISSION && manifest.seeds.length === 1;
  });

  await runner.runTest("Step 2: Attach to mission", async () => {
    const attached = await setCurrentMission(INTEGRATION_MISSION, cwdAbsolute);
    const current = await getCurrentMission(cwdAbsolute);
    return attached && current === INTEGRATION_MISSION;
  });

  await runner.runTest("Step 3: Execute scanner module", async () => {
    const manifest = await loadManifest(INTEGRATION_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const result = await executeModule(mockScannerModule, manifest, cwdAbsolute, [SEED_IP], ui);
    return result.success === true;
  });

  await runner.runTest("Step 4: Execute nettree module", async () => {
    const manifest = await loadManifest(INTEGRATION_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const result = await executeModule(mockNettreeModule, manifest, cwdAbsolute, [SEED_IP], ui);
    return result.success === true && (result.newAssets?.length || 0) > 0;
  });

  await runner.runTest("Step 5: Verify assets recorded", async () => {
    const manifest = await loadManifest(INTEGRATION_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const ipCount = manifest.assets.ips.length;
    const historyCount = manifest.history.length;
    return ipCount > 0 && historyCount >= 2;
  });

  await runner.runTest("Step 6: Verify history recorded", async () => {
    const manifest = await loadManifest(INTEGRATION_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const hasScannerEntry = manifest.history.some((h) => h.module === "scanner");
    const hasNettreeEntry = manifest.history.some((h) => h.module === "nettree");
    return hasScannerEntry && hasNettreeEntry;
  });

  await runner.runTest("Step 7: Verify asset parent relationships", async () => {
    const manifest = await loadManifest(INTEGRATION_MISSION, cwdAbsolute);
    if (!manifest) return false;
    const discoveredAssets = manifest.assets.ips.filter((ip) => ip.parent === SEED_IP);
    return discoveredAssets.length > 0;
  });

  await runner.runTest("Step 8: Detach from mission", async () => {
    const cleared = await clearCurrentMission(cwdAbsolute);
    const current = await getCurrentMission(cwdAbsolute);
    return cleared && current === null;
  });

  await runner.runTest("Cleanup: Remove test mission", async () => {
    try {
      await FileSystem.Remove(getMissionDir(INTEGRATION_MISSION, cwdAbsolute), { absolute: true, recursive: true });
      return true;
    } catch {
      return false;
    }
  });

  return runner.getResults();
}

// ============================================================================
// SECTION: Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const ui = UI.ctx();
  const args = Shell.GetArgs ? Shell.GetArgs() : [];
  const command = args[0] || "help";

  ui.section("NINE CLI - MILESTONE 1 FOUNDATION TEST SUITE");
  ui.print("Version", "v0.1.0-pragmatic", { label: "white", value: "cyan" });
  ui.divider();

  let allResults: TestResult[] = [];

  switch (command) {
    case "test-ui":
      allResults = await testUI();
      break;
    case "test-storage":
      allResults = await testStorage();
      break;
    case "test-utils":
      allResults = await testUtils();
      break;
    case "test-mission":
      allResults = await testMissionManager();
      break;
    case "test-session":
      allResults = await testSession();
      break;
    case "test-runner":
      allResults = await testRunner();
      break;
    case "test-cli":
      allResults = await testCLI();
      break;
    case "full-test":
      allResults = allResults.concat(await testUI());
      allResults = allResults.concat(await testStorage());
      allResults = allResults.concat(await testUtils());
      allResults = allResults.concat(await testMissionManager());
      allResults = allResults.concat(await testSession());
      allResults = allResults.concat(await testRunner());
      allResults = allResults.concat(await testCLI());
      allResults = allResults.concat(await runFullIntegrationTest());
      break;
    case "help":
    default:
      ui.print("Milestone 1 Pragmatic Test Suite", undefined, { label: "white" });
      ui.divider();
      ui.info("Available commands:");
      ui.print("  test-ui", "Test UI system (basic)", { label: "cyan", value: "gray" });
      ui.print("  test-storage", "Test FileSystem operations", { label: "cyan", value: "gray" });
      ui.print("  test-utils", "Test dedupeAssets + helpers", { label: "cyan", value: "gray" });
      ui.print("  test-mission", "Test MissionManager lifecycle", { label: "cyan", value: "gray" });
      ui.print("  test-session", "Test session persistence", { label: "cyan", value: "gray" });
      ui.print("  test-runner", "Test module runner + history", { label: "cyan", value: "gray" });
      ui.print("  test-cli", "Test CLI dispatcher flow", { label: "cyan", value: "gray" });
      ui.print("  full-test", "Run complete test suite", { label: "green", value: "gray" });
      ui.divider();
      ui.info("Example: node test-milestone-1.ts full-test");
      return;
  }

  ui.divider();
  const passed = allResults.filter((r) => r.passed).length;
  const total = allResults.length;

  if (passed === total) {
    ui.success(`ALL TESTS PASSED: ${passed}/${total}`);
    ui.success("Milestone 1 Foundation is ready for implementation!");
  } else {
    ui.error(`TESTS FAILED: ${passed}/${total}`);
    ui.info("Failed tests:");
    for (const result of allResults) {
      if (!result.passed) ui.error(`  - ${result.name}: ${result.error || "Assertion failed"}`);
    }
  }

  ui.divider();
  ui.info("Test execution complete. Ready for HackHub validation.");
}

main().catch((err) => {
  UI.ctx().error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
});
