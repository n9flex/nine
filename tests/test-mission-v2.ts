/**
 * test-mission-v2.ts
 * Mission-Centric Architecture v2 - avec système d'attachement et multi-IP
 * 
 * Nouvelles fonctionnalités:
 * 1. Test des fichiers cachés (.current_mission)
 * 2. Système d'attachement (attach/detach/status)
 * 3. Gestion de plusieurs IPs découvertes
 * 4. Pas besoin de répéter mission + IP à chaque commande
 * 
 * Usage:
 *   run("/test-mission-v2.ts", ["create", "BanqueMexico", "211.189.37.178"])
 *   run("/test-mission-v2.ts", ["attach", "BanqueMexico"])           ← S'attacher
 *   run("/test-mission-v2.ts", ["scan", "211.189.37.178"])           ← Utilise mission attachée
 *   run("/test-mission-v2.ts", ["nettree", "211.189.37.178"])        ← Découvre multi-IPs
 *   run("/test-mission-v2.ts", ["status"])                           ← Voir mission active
 *   run("/test-mission-v2.ts", ["show"])                             ← Afficher sans nom
 *   run("/test-mission-v2.ts", ["list-assets"])                     ← Lister tous les IPs/assets
 *   run("/test-mission-v2.ts", ["scan-all"])                       ← Scanner tous les IPs de la mission
 *   run("/test-mission-v2.ts", ["detach"])                          ← Détacher
 */

declare namespace Shell {
  function GetArgs(): string[];
}

declare namespace FileSystem {
  function cwd(): Promise<{ currentPath: string; absolutePath: string }>;
  function ReadDir(path: string, options?: { absolute?: boolean }): Promise<Array<{ name: string; extension: string; size: number }> | null>;
  function ReadFile(path: string, options?: { absolute?: boolean }): Promise<string>;
  function WriteFile(path: string, content: string, options?: { absolute?: boolean; recursive?: boolean }): Promise<void>;
  function Remove(path: string, options?: { absolute?: boolean; recursive?: boolean }): Promise<void>;
  function SetPath(path: string, options?: { absolute?: boolean }): Promise<void>;
}

declare namespace Networking {
  function IsIp(ip: string): boolean;
}

declare function println(text: string | Array<{ text: string; color: string }>): void;
declare function checkLib(name: string): boolean;
declare function ShellGetArgs(): string[];

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const COLORS = {
  success: "#22c55e",
  error: "#ff4c4c",
  warning: "#f59e0b",
  info: "#3b82f6",
  cyan: "#06b6d4",
  magenta: "#c084fc",
  gray: "#6b7280",
  white: "#ffffff",
  pink: "rgb(255, 0, 179)",
  yellow: "#fbbf24",
} as const;

const LOOT_DIR = "loot";
let CURRENT_MISSION_FILE: string; // Sera initialisé avec chemin absolu

async function initPaths(): Promise<void> {
  const cwd = await FileSystem.cwd();
  CURRENT_MISSION_FILE = `${cwd.absolutePath}/${LOOT_DIR}/.current_mission`;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Asset {
  value: string;
  type: "ip" | "domain" | "email" | "name";
  source: string;
  discoveredAt: string;
  parent?: string;
  scanned?: boolean;  // Pour tracker si on a déjà scanné cet IP
}

interface MissionManifest {
  name: string;
  created: string;
  updated: string;
  seeds: string[];
  assets: Asset[];
  modulesRun: string[];
  active?: boolean;  // Si on est attaché à cette mission
}

interface ScanResult {
  target: string;
  ports: Array<{ port: number; service: string; version: string; state: string }>;
  scannedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// UI UTILITIES
// ═══════════════════════════════════════════════════════════════

function printSuccess(message: string): void {
  println({ text: `[+] ${message}`, color: COLORS.success });
}

function printError(message: string): void {
  println({ text: `[!] ${message}`, color: COLORS.error });
}

function printInfo(message: string): void {
  println({ text: `[i] ${message}`, color: COLORS.info });
}

function printWarning(message: string): void {
  println({ text: `[!] ${message}`, color: COLORS.warning });
}

function printAttached(message: string): void {
  println({ text: `[→] ${message}`, color: COLORS.pink });
}

function safePrintln(text: string, color: string = COLORS.white): void {
  if (text && text.trim()) {
    println({ text, color });
  }
}

function printSection(title: string): void {
  safePrintln("═══════════════════════════════════════════════════", COLORS.gray);
  println({ text: `  ${title}`, color: COLORS.cyan });
  safePrintln("═══════════════════════════════════════════════════", COLORS.gray);
}

function printDivider(): void {
  println({ text: "───────────────────────────────────────────────────", color: COLORS.gray });
}

// ═══════════════════════════════════════════════════════════════
// SESSION / ATTACHMENT SYSTEM
// ═══════════════════════════════════════════════════════════════

/**
 * Test si les fichiers cachés fonctionnent
 * Utilise un fichier de test séparé pour ne pas supprimer la session
 */
async function testHiddenFiles(): Promise<boolean> {
  try {
    if (!CURRENT_MISSION_FILE) await initPaths();
    const testFile = CURRENT_MISSION_FILE.replace('.current_mission', '.test_hidden');
    
    // Essayer de créer un fichier caché
    await FileSystem.WriteFile(testFile, "test", { absolute: true });
    
    // Essayer de le lire
    const content = await FileSystem.ReadFile(testFile, { absolute: true });
    
    // Nettoyer (le fichier de test, pas la session!)
    await FileSystem.Remove(testFile, { absolute: true });
    
    return content === "test";
  } catch (err) {
    return false;
  }
}

/**
 * S'attacher à une mission
 */
async function attachMission(missionName: string): Promise<boolean> {
  try {
    if (!CURRENT_MISSION_FILE) await initPaths();
    // Vérifier que la mission existe
    const manifest = await loadManifest(missionName);
    if (!manifest) {
      printError(`Mission '${missionName}' n'existe pas. Crée-la d'abord avec: create`);
      return false;
    }
    
    // Sauvegarder l'attachement
    await FileSystem.WriteFile(
      CURRENT_MISSION_FILE,
      JSON.stringify({ 
        mission: missionName, 
        attachedAt: new Date().toISOString() 
      }),
      { absolute: true, recursive: true }
    );
    
    // Mettre à jour le manifest
    manifest.active = true;
    await saveManifest(manifest);
    
    printSuccess(`Attaché à la mission: ${missionName}`);
    printInfo(`Tu peux maintenant utiliser les commandes sans préciser la mission`);
    printInfo(`Exemple: scan <ip> au lieu de scan <mission> <ip>`);
    return true;
  } catch (err) {
    printError(`Impossible de s'attacher: ${err}`);
    return false;
  }
}

/**
 * Détacher de la mission courante
 */
async function detachMission(): Promise<void> {
  try {
    if (!CURRENT_MISSION_FILE) await initPaths();
    // Lire l'actuel pour le message
    const current = await getCurrentMission();
    
    // Supprimer le fichier
    await FileSystem.Remove(CURRENT_MISSION_FILE, { absolute: true });
    
    // Désactiver dans le manifest
    if (current) {
      const manifest = await loadManifest(current);
      if (manifest) {
        manifest.active = false;
        await saveManifest(manifest);
      }
    }
    
    printSuccess("Détaché de la mission");
  } catch {
    printWarning("Aucune mission active à détacher");
  }
}

/**
 * Obtenir la mission courante
 */
async function getCurrentMission(): Promise<string | null> {
  try {
    if (!CURRENT_MISSION_FILE) await initPaths();
    const content = await FileSystem.ReadFile(CURRENT_MISSION_FILE, { absolute: true });
    const data = JSON.parse(content);
    return data.mission || null;
  } catch {
    return null;
  }
}

/**
 * Afficher le statut courant
 */
async function showStatus(): Promise<void> {
  const current = await getCurrentMission();
  
  printSection("STATUT DE SESSION");
  
  if (current) {
    printAttached(`Mission active: ${current}`);
    const manifest = await loadManifest(current);
    if (manifest) {
      const ipCount = manifest.assets.filter(a => a.type === "ip").length;
      const unscanned = manifest.assets.filter(a => a.type === "ip" && !a.scanned).length;
      printInfo(`Assets: ${manifest.assets.length} total (${ipCount} IPs, ${unscanned} non scannés)`);
      printInfo(`Modules exécutés: ${manifest.modulesRun.join(", ") || "aucun"}`);
    }
  } else {
    printWarning("Aucune mission attachée");
    printInfo("Utilise: attach <mission-name> pour t'attacher");
  }
  
  // Test fichiers cachés
  const hiddenWorks = await testHiddenFiles();
  printDivider();
  if (hiddenWorks) {
    printSuccess("Fichiers cachés (.dotfile): Supporté");
  } else {
    printError("Fichiers cachés: NON supporté - utiliser loot/current_mission (sans point)");
  }
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function sanitizeMissionName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
}

function getMissionDir(missionName: string): string {
  return `${LOOT_DIR}/${sanitizeMissionName(missionName)}`;
}

async function createMissionStructure(missionName: string, seed: string): Promise<boolean> {
  try {
    const missionDir = getMissionDir(missionName);
    
    // Créer structure
    await FileSystem.WriteFile(`${missionDir}/data/.keep`, "", { recursive: true });
    await FileSystem.WriteFile(`${missionDir}/reports/.keep`, "", { recursive: true });
    
    const manifest: MissionManifest = {
      name: missionName,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      seeds: [seed],
      assets: [{
        value: seed,
        type: Networking.IsIp(seed) ? "ip" : "domain",
        source: "user",
        discoveredAt: new Date().toISOString(),
        scanned: false,
      }],
      modulesRun: [],
      active: false,
    };
    
    await FileSystem.WriteFile(
      `${missionDir}/manifest.json`,
      JSON.stringify(manifest, null, 2),
      { absolute: false }
    );
    
    printSuccess(`Mission créée: ${missionName}`);
    printInfo(`Seed: ${seed}`);
    printInfo(`Dossier: ${missionDir}/`);
    return true;
  } catch (err) {
    printError(`Erreur création: ${err}`);
    return false;
  }
}

async function loadManifest(missionName: string): Promise<MissionManifest | null> {
  try {
    const missionDir = getMissionDir(missionName);
    const content = await FileSystem.ReadFile(`${missionDir}/manifest.json`, { absolute: false });
    return JSON.parse(content) as MissionManifest;
  } catch {
    return null;
  }
}

async function saveManifest(manifest: MissionManifest): Promise<boolean> {
  try {
    const missionDir = getMissionDir(manifest.name);
    manifest.updated = new Date().toISOString();
    await FileSystem.WriteFile(
      `${missionDir}/manifest.json`,
      JSON.stringify(manifest, null, 2),
      { absolute: false }
    );
    return true;
  } catch (err) {
    printError(`Erreur sauvegarde: ${err}`);
    return false;
  }
}

/**
 * Ajouter un asset avec gestion des doublons
 */
async function addAsset(
  missionName: string,
  asset: Omit<Asset, "discoveredAt" | "scanned">
): Promise<boolean> {
  const manifest = await loadManifest(missionName);
  if (!manifest) {
    printError(`Mission inconnue: ${missionName}`);
    return false;
  }
  
  const exists = manifest.assets.find(a => a.value === asset.value && a.type === asset.type);
  if (exists) {
    printInfo(`Asset déjà connu: ${asset.value}`);
    return true;
  }
  
  manifest.assets.push({
    ...asset,
    discoveredAt: new Date().toISOString(),
    scanned: false,
  });
  
  return await saveManifest(manifest);
}

/**
 * Marquer un IP comme scanné
 */
async function markIpScanned(missionName: string, ip: string): Promise<void> {
  const manifest = await loadManifest(missionName);
  if (!manifest) return;
  
  const asset = manifest.assets.find(a => a.value === ip && a.type === "ip");
  if (asset) {
    asset.scanned = true;
    await saveManifest(manifest);
  }
}

async function recordModuleRun(missionName: string, moduleName: string): Promise<void> {
  const manifest = await loadManifest(missionName);
  if (!manifest) return;
  
  if (!manifest.modulesRun.includes(moduleName)) {
    manifest.modulesRun.push(moduleName);
    await saveManifest(manifest);
  }
}

// ═══════════════════════════════════════════════════════════════
// MULTI-IP HANDLING
// ═══════════════════════════════════════════════════════════════

/**
 * Lister tous les IPs d'une mission
 */
async function listMissionAssets(missionName: string): Promise<void> {
  const manifest = await loadManifest(missionName);
  if (!manifest) {
    printError(`Mission inconnue: ${missionName}`);
    return;
  }
  
  printSection(`ASSETS: ${missionName}`);
  
  const ips = manifest.assets.filter(a => a.type === "ip");
  const domains = manifest.assets.filter(a => a.type === "domain");
  const emails = manifest.assets.filter(a => a.type === "email");
  
  if (ips.length > 0) {
    println({ text: `[IPs] (${ips.length})`, color: COLORS.magenta });
    ips.forEach((ip, i) => {
      const status = ip.scanned ? "✓" : "○";
      const source = ip.source !== "user" ? ` ← ${ip.source}` : "";
      println({ text: `  ${i}) ${status} ${ip.value}${source}`, color: COLORS.cyan });
    });
  }
  
  if (domains.length > 0) {
    println({ text: `[Domains] (${domains.length})`, color: COLORS.magenta });
    domains.forEach(d => {
      const parent = d.parent ? ` ← ${d.parent}` : "";
      println({ text: `  ${d.value}${parent}`, color: COLORS.cyan });
    });
  }
  
  if (emails.length > 0) {
    println({ text: `[Emails] (${emails.length})`, color: COLORS.magenta });
    emails.forEach(e => println({ text: `  ${e.value}`, color: COLORS.cyan }));
  }
  
  printDivider();
  safePrintln("Légende: ✓ = scanné, ○ = non scanné", COLORS.gray);
}

/**
 * Scanner tous les IPs non-scannés de la mission
 */
async function scanAllMissionIPs(missionName: string): Promise<void> {
  const manifest = await loadManifest(missionName);
  if (!manifest) {
    printError(`Mission inconnue: ${missionName}`);
    return;
  }
  
  const unscannedIps = manifest.assets.filter(
    a => a.type === "ip" && !a.scanned
  );
  
  if (unscannedIps.length === 0) {
    printWarning("Tous les IPs sont déjà scannés");
    return;
  }
  
  printSection(`SCAN DE ${unscannedIps.length} IPs`);
  
  for (const ipAsset of unscannedIps) {
    printDivider();
    println({ text: `Scanning: ${ipAsset.value}`, color: COLORS.yellow });
    await runScannerModule(missionName, ipAsset.value);
    await markIpScanned(missionName, ipAsset.value);
  }
  
  printSuccess(`Terminé: ${unscannedIps.length} IPs scannés`);
}

// ═══════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════

async function saveScanResults(
  missionName: string,
  target: string,
  results: ScanResult
): Promise<boolean> {
  try {
    const missionDir = getMissionDir(missionName);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    
    // JSON
    const jsonPath = `${missionDir}/data/scanner_${target.replace(/\./g, "_")}_${timestamp}.json`;
    await FileSystem.WriteFile(
      jsonPath,
      JSON.stringify(results, null, 2),
      { absolute: false }
    );
    
    // TXT lisible
    const txtPath = `${missionDir}/reports/scan_${target.replace(/\./g, "_")}.txt`;
    const txtContent = formatScanReport(results);
    await FileSystem.WriteFile(txtPath, txtContent, { absolute: false });
    
    printSuccess(`Rapports sauvegardés`);
    return true;
  } catch (err) {
    printError(`Erreur sauvegarde: ${err}`);
    return false;
  }
}

function formatScanReport(results: ScanResult): string {
  const lines: string[] = [
    "═══════════════════════════════════════════════════",
    "  NINE SCAN REPORT",
    "═══════════════════════════════════════════════════",
    ``,
    `Target:    ${results.target}`,
    `Time:      ${results.scannedAt}`,
    ``,
  ];
  
  const open = results.ports.filter(p => p.state === "OPEN");
  const filtered = results.ports.filter(p => p.state === "FILTERED");
  
  if (open.length > 0) {
    lines.push("[PORTS OUVERTS]");
    open.forEach(p => lines.push(`  ${p.port}/tcp  ${p.service} ${p.version}`));
    lines.push("");
  }
  
  if (filtered.length > 0) {
    lines.push("[PORTS FILTRÉS]");
    filtered.forEach(p => lines.push(`  ${p.port}/tcp  ${p.service} ${p.version}`));
    lines.push("");
  }
  
  lines.push(`Total: ${open.length} ouverts, ${filtered.length} filtrés`);
  return lines.join("\n");
}

async function runScannerModule(missionName: string, target: string): Promise<void> {
  printInfo(`Scan de ${target}...`);
  
  const results: ScanResult = {
    target,
    scannedAt: new Date().toISOString(),
    ports: [
      { port: 22, service: "ssh", version: "OpenSSH 8.2", state: "OPEN" },
      { port: 80, service: "http", version: "Apache 2.4.41", state: "OPEN" },
      { port: 443, service: "https", version: "Apache 2.4.41", state: "OPEN" },
    ],
  };
  
  await saveScanResults(missionName, target, results);
  await markIpScanned(missionName, target);
  await recordModuleRun(missionName, "scanner");
  
  println({ text: "  [PORTS]", color: COLORS.magenta });
  results.ports.forEach(p => {
    const color = p.state === "OPEN" ? COLORS.success : COLORS.warning;
    println({ text: `  ${p.port}/tcp ${p.state} ${p.service}`, color });
  });
  
  printSuccess("Scan terminé");
}

/**
 * NetTree avec découverte MULTIPLE d'IPs
 */
async function runNettreeModule(missionName: string, target: string): Promise<void> {
  printInfo(`NetTree discovery depuis ${target}...`);
  
  // Simuler la découverte de PLUSIEURS IPs (comme dans le vrai jeu)
  const discoveredIPs = [
    "206.224.28.187",   // Router
    "192.168.1.45",     // Device 1
    "192.168.1.67",     // Device 2
    "10.0.0.5",         // Internal
  ];
  
  printInfo(`Découverte de ${discoveredIPs.length} nouveaux nœuds:`);
  
  for (const ip of discoveredIPs) {
    await addAsset(missionName, {
      value: ip,
      type: "ip",
      source: "nettree",
      parent: target,
    });
    println({ text: `  + ${ip}`, color: COLORS.cyan });
  }
  
  // Sauvegarder rapport
  const missionDir = getMissionDir(missionName);
  const report = [
    "═══════════════════════════════════════════════════",
    "  NETTREE DISCOVERY REPORT",
    "═══════════════════════════════════════════════════",
    ``,
    `Source: ${target}`,
    `Time: ${new Date().toISOString()}`,
    ``,
    `[DISCOVERED NODES]`,
    ...discoveredIPs.map(ip => `  ${ip}`),
    ``,
    `Total: ${discoveredIPs.length} nœuds`,
  ].join("\n");
  
  await FileSystem.WriteFile(
    `${missionDir}/reports/nettree_${target.replace(/\./g, "_")}.txt`,
    report,
    { absolute: false }
  );
  
  await recordModuleRun(missionName, "nettree");
  printSuccess(`${discoveredIPs.length} IPs ajoutés à la mission`);
}

async function runLynxModule(missionName: string, term: string): Promise<void> {
  printInfo(`OSINT: ${term}...`);
  
  const domain = "banque.mx";
  const email = "admin@banque.mx";
  
  await addAsset(missionName, { value: domain, type: "domain", source: "lynx", parent: term });
  await addAsset(missionName, { value: email, type: "email", source: "lynx", parent: domain });
  
  printSuccess(`Trouvé: ${domain}, ${email}`);
}

// ═══════════════════════════════════════════════════════════════
// DISPLAY
// ═══════════════════════════════════════════════════════════════

async function showMission(missionName?: string): Promise<void> {
  const target = missionName || await getCurrentMission();
  
  if (!target) {
    printError("Spécifie une mission ou attache-toi d'abord");
    return;
  }
  
  const manifest = await loadManifest(target);
  if (!manifest) {
    printError(`Mission inconnue: ${target}`);
    return;
  }
  
  const isCurrent = (await getCurrentMission()) === target;
  const title = isCurrent ? `MISSION: ${target} [ATTACHÉ]` : `MISSION: ${target}`;
  
  printSection(title);
  
  println({ text: `Créée: ${manifest.created}`, color: COLORS.gray });
  println({ text: `Mise à jour: ${manifest.updated}`, color: COLORS.gray });
  println({ text: `Seeds: ${manifest.seeds.join(", ")}`, color: COLORS.pink });
  printDivider();
  
  const ips = manifest.assets.filter(a => a.type === "ip");
  const domains = manifest.assets.filter(a => a.type === "domain");
  const emails = manifest.assets.filter(a => a.type === "email");
  
  if (ips.length > 0) {
    println({ text: `[IPs]`, color: COLORS.magenta });
    ips.forEach(ip => {
      const tag = ip.source !== "user" ? ` (via ${ip.source})` : "";
      const scan = ip.scanned ? " ✓" : "";
      println({ text: `  ${ip.value}${tag}${scan}`, color: COLORS.cyan });
    });
  }
  
  if (domains.length > 0) {
    println({ text: `[Domains]`, color: COLORS.magenta });
    domains.forEach(d => println({ text: `  ${d.value}`, color: COLORS.cyan }));
  }
  
  if (emails.length > 0) {
    println({ text: `[Emails]`, color: COLORS.magenta });
    emails.forEach(e => println({ text: `  ${e.value}`, color: COLORS.cyan }));
  }
  
  if (manifest.modulesRun.length > 0) {
    printDivider();
    println({ text: `Modules: ${manifest.modulesRun.join(", ")}`, color: COLORS.gray });
  }
  safePrintln("", COLORS.gray);
}

async function listMissions(): Promise<void> {
  try {
    const lootDir = await FileSystem.ReadDir(LOOT_DIR, { absolute: false });
    if (!lootDir || lootDir.length === 0) {
      printWarning("Aucune mission");
      return;
    }
    
    const current = await getCurrentMission();
    
    printSection("MISSIONS");
    
    for (const entry of lootDir) {
      if (entry.extension) continue;
      
      const manifest = await loadManifest(entry.name);
      const marker = current === entry.name ? " → " : "   ";
      
      if (manifest) {
        const ipCount = manifest.assets.filter(a => a.type === "ip").length;
        println({
          text: `${marker}${entry.name.padEnd(20)} ${ipCount} IPs`,
          color: current === entry.name ? COLORS.pink : COLORS.cyan,
        });
      } else {
        println({ text: `   ${entry.name} (invalide)`, color: COLORS.gray });
      }
    }
    
    safePrintln("", COLORS.gray);
    safePrintln("Légende: → = mission attachée", COLORS.gray);
  } catch {
    printWarning("Erreur lecture missions");
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN DISPATCHER
// ═══════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  // Initialiser les chemins explicitement au début
  await initPaths();
  
  const args = Shell.GetArgs ? Shell.GetArgs() : [];
  const command = args[0];
  const currentMission = await getCurrentMission();
  
  safePrintln("═══════════════════════════════════════════════════", COLORS.cyan);
  println({ text: "  NINE MISSION-CENTRIC v2", color: COLORS.cyan });
  safePrintln("═══════════════════════════════════════════════════", COLORS.cyan);
  
  if (currentMission) {
    println({ text: `  [Attaché: ${currentMission}]`, color: COLORS.pink });
  }
  
  safePrintln("", COLORS.gray);
  
  switch (command) {
    case "create": {
      const name = args[1];
      const seed = args[2];
      if (!name || !seed) {
        printError("Usage: create <nom> <ip/domain>");
        return;
      }
      await createMissionStructure(name, seed);
      break;
    }
    
    case "attach": {
      const name = args[1];
      if (!name) {
        printError("Usage: attach <mission>");
        return;
      }
      await attachMission(name);
      break;
    }
    
    case "detach": {
      await detachMission();
      break;
    }
    
    case "status": {
      await showStatus();
      break;
    }
    
    case "scan": {
      let mission = args[2] ? args[1] : currentMission;
      let target = args[2] || args[1];
      
      if (!mission) {
        printError("Usage: scan <mission> <ip> OU attach-toi d'abord");
        return;
      }
      if (!target || !Networking.IsIp(target)) {
        printError("IP invalide");
        return;
      }
      
      await runScannerModule(mission, target);
      break;
    }
    
    case "nettree": {
      let mission = args[2] ? args[1] : currentMission;
      let target = args[2] || args[1];
      
      if (!mission) {
        printError("Usage: nettree <mission> <ip> OU attach-toi d'abord");
        return;
      }
      if (!target) {
        printError("Spécifie un IP cible");
        return;
      }
      
      await runNettreeModule(mission, target);
      break;
    }
    
    case "lynx": {
      let mission = args[2] ? args[1] : currentMission;
      let term = args[2] || args[1];
      
      if (!mission) {
        printError("Usage: lynx <mission> <terme> OU attach-toi");
        return;
      }
      if (!term) {
        printError("Spécifie un terme de recherche");
        return;
      }
      
      await runLynxModule(mission, term);
      break;
    }
    
    case "show": {
      const name = args[1] || currentMission;
      if (!name) {
        printError("Usage: show <mission> OU attach-toi");
        return;
      }
      await showMission(name);
      break;
    }
    
    case "list":
    case "missions": {
      await listMissions();
      break;
    }
    
    case "list-assets": {
      const name = args[1] || currentMission;
      if (!name) {
        printError("Usage: list-assets <mission> OU attach-toi");
        return;
      }
      await listMissionAssets(name);
      break;
    }
    
    case "scan-all": {
      const name = args[1] || currentMission;
      if (!name) {
        printError("Usage: scan-all <mission> OU attach-toi");
        return;
      }
      await scanAllMissionIPs(name);
      break;
    }
    
    case "full-test": {
      // Test complet
      printSection("TEST COMPLET v2");
      
      // 1. Test fichiers cachés
      printInfo("Test 1: Fichiers cachés");
      const hiddenWorks = await testHiddenFiles();
      if (hiddenWorks) {
        printSuccess("Fichiers cachés fonctionnent");
      } else {
        printWarning("Fichiers cachés non supportés - fallback utilisé");
      }
      
      // 2. Créer mission
      const testMission = "BanqueTest";
      const testIP = "211.189.37.178";
      printInfo("Test 2: Création mission");
      await createMissionStructure(testMission, testIP);
      
      // 3. Attacher
      printInfo("Test 3: Attachement");
      await attachMission(testMission);
      
      // 4. Scan (sans préciser mission)
      printInfo("Test 4: Scan avec mission attachée");
      await runScannerModule(testMission, testIP);
      
      // 5. NetTree (multi-IP)
      printInfo("Test 5: NetTree multi-IP");
      await runNettreeModule(testMission, testIP);
      
      // 6. Lister assets
      printInfo("Test 6: Lister assets");
      await listMissionAssets(testMission);
      
      // 7. Scan-all
      printInfo("Test 7: Scan-all IPs non-scannés");
      await scanAllMissionIPs(testMission);
      
      // 8. Status
      printInfo("Test 8: Status");
      await showStatus();
      
      // 9. Show
      printInfo("Test 9: Affichage mission");
      await showMission(testMission);
      
      // 10. Détacher
      printInfo("Test 10: Détachement");
      await detachMission();
      
      printSection("TEST COMPLET RÉUSSI");
      break;
    }
    
    default: {
      println({ text: "  Création & Session:", color: COLORS.yellow });
      println({ text: "    create <nom> <ip>       - Créer mission", color: COLORS.gray });
      println({ text: "    attach <nom>            - S'attacher", color: COLORS.gray });
      println({ text: "    detach                  - Se détacher", color: COLORS.gray });
      println({ text: "    status                  - Voir statut", color: COLORS.gray });
      safePrintln("", COLORS.gray);
      println({ text: "  Modules (mission optionnelle si attaché):", color: COLORS.yellow });
      println({ text: "    scan <ip>               - Scanner IP", color: COLORS.gray });
      println({ text: "    nettree <ip>            - Découvrir réseau", color: COLORS.gray });
      println({ text: "    lynx <terme>            - OSINT", color: COLORS.gray });
      safePrintln("", COLORS.gray);
      println({ text: "  Visualisation:", color: COLORS.yellow });
      println({ text: "    show [mission]          - Afficher mission", color: COLORS.gray });
      println({ text: "    list                    - Lister missions", color: COLORS.gray });
      println({ text: "    list-assets [mission]   - Lister IPs/assets", color: COLORS.gray });
      println({ text: "    scan-all [mission]      - Scanner tous IPs", color: COLORS.gray });
      safePrintln("", COLORS.gray);
      println({ text: "  Test:", color: COLORS.yellow });
      println({ text: "    full-test               - Test complet", color: COLORS.gray });
      safePrintln("", COLORS.gray);
      println({ text: "EXEMPLE DE WORKFLOW:", color: COLORS.cyan });
      println({ text: '  run("/test-mission-v2.ts", ["create", "Mexico", "211.189.37.178"])', color: COLORS.yellow });
      println({ text: '  run("/test-mission-v2.ts", ["attach", "Mexico"])', color: COLORS.yellow });
      println({ text: '  run("/test-mission-v2.ts", ["scan", "211.189.37.178"])', color: COLORS.yellow });
      println({ text: '  run("/test-mission-v2.ts", ["nettree", "211.189.37.178"])', color: COLORS.yellow });
      println({ text: '  run("/test-mission-v2.ts", ["list-assets"])   ← voit les IPs découverts', color: COLORS.yellow });
      println({ text: '  run("/test-mission-v2.ts", ["scan-all"])      ← scan tous les IPs', color: COLORS.yellow });
      safePrintln("", COLORS.gray );
    }
  }
}

main().catch(err => printError(`Erreur: ${err}`));
