/**
 * Test local des palettes de couleurs pour nine
 * Usage: node tests/test-colors-local.js [palette]
 * 
 * Palettes: default, ocean, hackhub, minimal, forest, amber, synthwave, matrix, sunset,
 *           noirrose, rougeviolet, dracula, tokyonight, sakura, hackhub2, NINE
 */

// Codes ANSI pour les couleurs
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  // Named colors (basic ANSI)
  named: {
    white: "\x1b[37m",
    gray: "\x1b[90m",
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
  },
  // 256 colors
  hex: (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  }
};

// Palettes
const PALETTES = {
  // Les VRAIES couleurs actuelles de nine.ts / lib/ui.ts
  nine: {
    name: "NINE (Current - vrai couleurs)",
    banner: "#00f2ff",      // cyan - ASCII art
    primary: "white",      // Texte important
    secondary: "gray",     // Labels, diviseurs
    accent: "#00f2ff",     // IPs, valeurs (anciennement cyan)
    success: "#a6ff00",    // [+] Open
    warning: "yellow",     // [!] Forwarded  
    error: "red",          // [-] Closed
    border: "#00f2ff",     // = borders
    open: "#a6ff00",       // OPEN rows
    forwarded: "yellow",   // FORWARDED rows
    closed: "red",         // CLOSED rows
  },

  default: {
    name: "Default (Cyan Heavy)",
    banner: "#00f2ff",
    primary: "#ffffff",
    secondary: "#64748b",
    accent: "#00f2ff",
    success: "#a6ff00",
    warning: "#ffcc00",
    error: "#ff4444",
    border: "#00f2ff",
    open: "#a6ff00",
    forwarded: "#ffcc00",
    closed: "#ff4444",
  },
  ocean: {
    name: "Ocean (No Cyan)",
    banner: "#60a5fa",
    primary: "#93c5fd",
    secondary: "#1e40af",
    accent: "#3b82f6",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#f87171",
    border: "#2563eb",
    open: "#4ade80",
    forwarded: "#fbbf24",
    closed: "#f87171",
  },
  hackhub: {
    name: "HackHub Dark",
    banner: "#ff2056",
    primary: "#e2e8f0",
    secondary: "#334155",
    accent: "#a855f7",
    success: "#39ff14",
    warning: "#ffcc00",
    error: "#ff3131",
    border: "#475569",
    open: "#39ff14",
    forwarded: "#ffcc00",
    closed: "#ff3131",
  },
  minimal: {
    name: "Minimal",
    banner: "#e5e7eb",
    primary: "#f3f4f6",
    secondary: "#6b7280",
    accent: "#d1d5db",
    success: "#a3e635",
    warning: "#facc15",
    error: "#f87171",
    border: "#4b5563",
    open: "#a3e635",
    forwarded: "#facc15",
    closed: "#f87171",
  },
  forest: {
    name: "Forest",
    banner: "#4ade80",
    primary: "#86efac",
    secondary: "#3f6212",
    accent: "#10b981",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#ef4444",
    border: "#22c55e",
    open: "#22c55e",
    forwarded: "#f59e0b",
    closed: "#ef4444",
  },
  amber: {
    name: "Terminal Amber",
    banner: "#ffb000",
    primary: "#ffb000",
    secondary: "#664400",
    accent: "#ffcc00",
    success: "#ffb000",
    warning: "#ff8800",
    error: "#ff4400",
    border: "#996600",
    open: "#ffb000",
    forwarded: "#ff8800",
    closed: "#ff4400",
  },
  synthwave: {
    name: "Synthwave",
    banner: "#ff10f0",
    primary: "#ff71ce",
    secondary: "#4c1d95",
    accent: "#00f0ff",
    success: "#00ff9f",
    warning: "#ff00ff",
    error: "#ff2056",
    border: "#8b5cf6",
    open: "#00ff9f",
    forwarded: "#ff71ce",
    closed: "#ff2056",
  },
  matrix: {
    name: "Matrix",
    banner: "#00ff41",
    primary: "#00ff41",
    secondary: "#003300",
    accent: "#33ff00",
    success: "#00ff41",
    warning: "#ffff00",
    error: "#ff0000",
    border: "#008800",
    open: "#00ff41",
    forwarded: "#ccff00",
    closed: "#ff3333",
  },
  sunset: {
    name: "Sunset",
    banner: "#fb923c",
    primary: "#fdba74",
    secondary: "#7c2d12",
    accent: "#f97316",
    success: "#a3e635",
    warning: "#fb923c",
    error: "#f87171",
    border: "#ea580c",
    open: "#a3e635",
    forwarded: "#fb923c",
    closed: "#f87171",
  },
  // Nouvelles palettes - style HackHub + couleurs préférées
  noirrose: {
    name: "Noir & Rose",
    banner: "#ec4899",
    primary: "#fbcfe8",
    secondary: "#831843",
    accent: "#f472b6",
    success: "#4ade80",
    warning: "#fbbf24",
    error: "#ef4444",
    border: "#be185d",
    open: "#4ade80",
    forwarded: "#fbbf24",
    closed: "#ef4444",
  },
  rougeviolet: {
    name: "Rouge Violet",
    banner: "#e11d48",
    primary: "#fda4af",
    secondary: "#881337",
    accent: "#8b5cf6",
    success: "#a3e635",
    warning: "#fbbf24",
    error: "#f43f5e",
    border: "#7f1d1d",
    open: "#a3e635",
    forwarded: "#fbbf24",
    closed: "#f43f5e",
  },
  dracula: {
    name: "Dracula",
    banner: "#ff79c6",
    primary: "#f8f8f2",
    secondary: "#6272a4",
    accent: "#bd93f9",
    success: "#50fa7b",
    warning: "#f1fa8c",
    error: "#ff5555",
    border: "#44475a",
    open: "#50fa7b",
    forwarded: "#f1fa8c",
    closed: "#ff5555",
  },
  tokyonight: {
    name: "Tokyo Night",
    banner: "#7aa2f7",
    primary: "#c0caf5",
    secondary: "#565f89",
    accent: "#bb9af7",
    success: "#9ece6a",
    warning: "#e0af68",
    error: "#f7768e",
    border: "#414868",
    open: "#9ece6a",
    forwarded: "#e0af68",
    closed: "#f7768e",
  },
  sakura: {
    name: "Sakura",
    banner: "#ff80ab",
    primary: "#fce4ec",
    secondary: "#880e4f",
    accent: "#ff4081",
    success: "#69f0ae",
    warning: "#ffd740",
    error: "#ff5252",
    border: "#ad1457",
    open: "#69f0ae",
    forwarded: "#ffd740",
    closed: "#ff5252",
  },
  hackhub2: {
    name: "HackHub Red",
    banner: "#ff2056",
    primary: "#ffe4e6",
    secondary: "#7f1d1d",
    accent: "#e11d48",
    success: "#22c55e",
    warning: "#f59e0b",
    error: "#dc2626",
    border: "#991b1b",
    open: "#22c55e",
    forwarded: "#f59e0b",
    closed: "#dc2626",
  },
};

const NINE_ART = `
    _   ____________
   / | / / ____/ __ \\
  /  |/ / /_  / / / /
 / /|  / __/ / /_/ / 
/_/ |_/_/    \\____/  
`;

const PORTS = [
  { port: 27970, service: "telnet", version: "Telnet 9.85.0", status: "CLOSED" },
  { port: 52651, service: "http", version: "Apache 2.53.92", status: "FORWARDED" },
  { port: 443, service: "https", version: "Apache 2.51.13", status: "CLOSED" },
  { port: 3389, service: "rdp", version: "FreeRDP 6.50.8", status: "OPEN" },
  { port: 13769, service: "http", version: "Apache 2.64.74", status: "CLOSED" },
];

function color(colorName, text) {
  // Check if it's a named color
  if (C.named[colorName]) {
    return C.named[colorName] + text + C.reset;
  }
  // Otherwise treat as hex
  return C.hex(colorName) + text + C.reset;
}

function print(text = "") {
  console.log(text);
}

function render(p) {
  const { banner, primary, secondary, accent, success, warning, error, border, open, forwarded, closed } = p;

  // Banner
  print();
  console.log(color(banner, NINE_ART));
  print();

  // Info messages
  console.log(color(secondary, "[i] Resolving subnet ..."));
  console.log(color(secondary, "[i] Scanning ports ..."));
  print();

  // Block title
  const width = 64;
  const title = "[ SCAN RESULTS ]";
  const pad = width - title.length;
  const left = Math.floor(pad / 2);
  const right = pad - left;

  console.log(color(border, "=".repeat(width)));
  console.log(
    color(secondary, " ".repeat(left)) + 
    color(primary, title) + 
    color(secondary, " ".repeat(right))
  );
  console.log(color(border, "=".repeat(width)));

  // Metadata
  const labelWidth = 15;
  console.log(color(secondary, "Target".padEnd(labelWidth) + "  ") + color(accent, "211.189.37.178"));
  console.log(color(secondary, "Subnet".padEnd(labelWidth) + "  ") + color(accent, "211.189.37.178 / 192.168.1.2"));
  console.log(color(secondary, "Router".padEnd(labelWidth) + "  ") + color(accent, "undefined -> undefined"));
  console.log(color(secondary, "Ports".padEnd(labelWidth) + "  ") + color(primary, `${PORTS.length} discovered`));

  console.log(color(secondary, "-".repeat(50)));

  // Table headers
  console.log(color(secondary, "Status      Port    Service      Version"));
  console.log(color(secondary, "-".repeat(50)));

  // Table rows
  for (const port of PORTS) {
    const rowColor = port.status === "OPEN" ? open : port.status === "FORWARDED" ? forwarded : closed;
    const line = `${port.status.padEnd(12)}${port.port.toString().padEnd(8)}${port.service.padEnd(13)}${port.version}`;
    console.log(color(rowColor, line));
  }

  console.log(color(secondary, "-".repeat(50)));

  // Summary
  const openCount = PORTS.filter(p => p.status === "OPEN").length;
  const forwardedCount = PORTS.filter(p => p.status === "FORWARDED").length;
  const closedCount = PORTS.filter(p => p.status === "CLOSED").length;

  console.log(color(success, `[+] Open: ${openCount}`));
  console.log(color(warning, `[!] Forwarded: ${forwardedCount}`));
  console.log(color(error, `[-] Closed: ${closedCount}`));

  console.log(color(border, "=".repeat(width)));
  print();

  console.log(color(success, "[+] Report saved: loot/211.189.37.178/scan.txt"));
  print();

  // Palette preview
  console.log(color(secondary, "-".repeat(50)));
  console.log(color(primary, `PALETTE: ${p.name}`));
  console.log(color(secondary, "-".repeat(50)));
  console.log(
    color(secondary, "Success: ") + color(success, "████") +
    color(secondary, "  Warning: ") + color(warning, "████") +
    color(secondary, "  Error: ") + color(error, "████")
  );
  console.log(
    color(secondary, "Accent:  ") + color(accent, "████") +
    color(secondary, "  Primary: ") + color(primary, "████") +
    color(secondary, "  Banner: ") + color(banner, "████")
  );
  console.log(color(secondary, "-".repeat(50)));
  print();
}

// CLI
const paletteName = process.argv[2] || "default";

if (paletteName === "--list" || paletteName === "-l") {
  console.log("Palettes disponibles:");
  for (const [key, p] of Object.entries(PALETTES)) {
    console.log(`  ${key.padEnd(12)} - ${p.name}`);
  }
  print();
  console.log("Usage:");
  console.log("  node tests/test-colors-local.js [palette]");
  print();
  console.log("Exemples:");
  console.log("  node tests/test-colors-local.js default   # Style actuel (cyan)");
  console.log("  node tests/test-colors-local.js ocean     # Bleu sans cyan");
  console.log("  node tests/test-colors-local.js hackhub  # Violet (HackHub)");
  console.log("  node tests/test-colors-local.js minimal  # Gris sobre");
} else if (PALETTES[paletteName]) {
  render(PALETTES[paletteName]);
} else {
  console.log(`Palette inconnue: ${paletteName}`);
  console.log("Utilise --list pour voir les palettes disponibles");
}
