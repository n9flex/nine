// colors.ts - Displays all available colors in HackHub

// -- Requirements --
// - apt-get install node

// -- Overview --
// Simple color palette viewer for HackHub scripting.
// Shows all named colors, hex colors, and background colors.

// --- FEATURES ---
// - Named colors (12 built-in colors)
// - Hex colors (80+ custom examples)
// - Brand colors (Discord, GitHub, etc.)
// - Cyberpunk/Retro theme colors
// - Background color demos
// - Rainbow gradient

newLine();

// ASCII Header - LYNX with different colors per letter
println([
  { text: "                                    ", color: "white" },
]);
println([
  { text: " ▄   ▄▄▄▄      ▄▄                  ", color: "#ff2056" },  // L - Sora Red
]);
println([
  { text: " ▀██████▀       ██                 ", color: "#00f2ff" },  // Y - Cyan
]);
println([
  { text: "   ██           ██       ▄         ", color: "#a6ff00" },  // N - Lime
]);
println([
  { text: "   ██     ▄███▄ ██ ▄███▄ ████▄▄██▀█", color: "#ff10f0" },  // X - Neon Pink
]);
println([
  { text: "   ██     ██ ██ ██ ██ ██ ██   ▀███▄", color: "#f97316" },  // (decor) - Orange
]);
println([
  { text: "   ▀█████▄▀███▀▄██▄▀███▀▄█▀  █▄▄██▀", color: "#8b5cf6" },  // (decor) - Purple
]);

newLine();
println("=== NAMED COLORS ===");
newLine();

const namedColors = [
  "black",
  "white",
  "gray",
  "red",
  "green",
  "blue",
  "yellow",
  "magenta",
  "cyan",
  "orange",
  "pink",
  "purple",
];

for (const color of namedColors) {
  println([
    { text: color.padEnd(12), color: "white" },
    { text: " ████████ ", color: color },
  ]);
}

newLine();
println("=== HEX COLORS (examples) ===");
newLine();

const hexColors = [
  { name: "Sora Red", hex: "#ff2056" },
  { name: "Lime", hex: "#32cd32" },
  { name: "Gold", hex: "#ffd700" },
  { name: "Hot Pink", hex: "#ff69b4" },
  { name: "Teal", hex: "#008080" },
  { name: "Coral", hex: "#ff7f50" },
  { name: "Violet", hex: "#8a2be2" },
  { name: "Dark Red", hex: "#8b0000" },
  { name: "Neon Green", hex: "#39ff14" },
  { name: "Sky Blue", hex: "#87ceeb" },
];

for (const { name, hex } of hexColors) {
  println([
    { text: name.padEnd(12), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== MODERN PALETTE (Tailwind-ish) ===");
newLine();

const modernColors = [
  { name: "Rose", hex: "#f43f5e" },
  { name: "Pink", hex: "#ec4899" },
  { name: "Fuchsia", hex: "#d946ef" },
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Indigo", hex: "#6366f1" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Sky", hex: "#0ea5e9" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Teal", hex: "#14b8a6" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Green", hex: "#22c55e" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Orange", hex: "#f97316" },
  { name: "Red", hex: "#ef4444" },
  { name: "Stone", hex: "#78716c" },
];

for (const { name, hex } of modernColors) {
  println([
    { text: name.padEnd(12), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== PASTEL COLORS ===");
newLine();

const pastelColors = [
  { name: "Pastel Red", hex: "#fca5a5" },
  { name: "Pastel Rose", hex: "#fda4af" },
  { name: "Pastel Orange", hex: "#fdba74" },
  { name: "Pastel Amber", hex: "#fcd34d" },
  { name: "Pastel Yellow", hex: "#fde047" },
  { name: "Pastel Lime", hex: "#bef264" },
  { name: "Pastel Green", hex: "#86efac" },
  { name: "Pastel Emerald", hex: "#6ee7b7" },
  { name: "Pastel Teal", hex: "#5eead4" },
  { name: "Pastel Cyan", hex: "#67e8f9" },
  { name: "Pastel Sky", hex: "#7dd3fc" },
  { name: "Pastel Blue", hex: "#93c5fd" },
  { name: "Pastel Indigo", hex: "#a5b4fc" },
  { name: "Pastel Violet", hex: "#c4b5fd" },
  { name: "Pastel Purple", hex: "#d8b4fe" },
  { name: "Pastel Fuchsia", hex: "#f0abfc" },
  { name: "Pastel Pink", hex: "#f9a8d4" },
];

for (const { name, hex } of pastelColors) {
  println([
    { text: name.padEnd(16), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== NEON / FLUO ===");
newLine();

const neonColors = [
  { name: "Neon Pink", hex: "#ff10f0" },
  { name: "Neon Red", hex: "#ff3131" },
  { name: "Neon Orange", hex: "#ff5e00" },
  { name: "Neon Yellow", hex: "#ffff00" },
  { name: "Neon Lime", hex: "#ccff00" },
  { name: "Neon Green", hex: "#39ff14" },
  { name: "Neon Mint", hex: "#00ff9f" },
  { name: "Neon Cyan", hex: "#00ffff" },
  { name: "Neon Blue", hex: "#00bfff" },
  { name: "Neon Purple", hex: "#bf00ff" },
  { name: "Neon Magenta", hex: "#ff00ff" },
  { name: "Hot Red", hex: "#ff073a" },
];

for (const { name, hex } of neonColors) {
  println([
    { text: name.padEnd(14), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== GRAYS & DARK THEME ===");
newLine();

const darkColors = [
  { name: "Slate 900", hex: "#0f172a" },
  { name: "Slate 800", hex: "#1e293b" },
  { name: "Slate 700", hex: "#334155" },
  { name: "Slate 600", hex: "#475569" },
  { name: "Slate 500", hex: "#64748b" },
  { name: "Slate 400", hex: "#94a3b8" },
  { name: "Slate 300", hex: "#cbd5e1" },
  { name: "Slate 200", hex: "#e2e8f0" },
  { name: "Slate 100", hex: "#f1f5f9" },
  { name: "Zinc 900", hex: "#18181b" },
  { name: "Zinc 800", hex: "#27272a" },
  { name: "Zinc 700", hex: "#3f3f46" },
  { name: "Zinc 600", hex: "#52525b" },
  { name: "Zinc 500", hex: "#71717a" },
  { name: "Neutral 900", hex: "#171717" },
  { name: "Neutral 800", hex: "#262626" },
  { name: "Stone 900", hex: "#1c1917" },
  { name: "Stone 800", hex: "#292524" },
];

for (const { name, hex } of darkColors) {
  println([
    { text: name.padEnd(14), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== BRAND COLORS ===");
newLine();

const brandColors = [
  { name: "Discord", hex: "#5865f2" },
  { name: "Discord Blurple", hex: "#7289da" },
  { name: "Spotify", hex: "#1db954" },
  { name: "Twitch", hex: "#9146ff" },
  { name: "YouTube", hex: "#ff0000" },
  { name: "Twitter", hex: "#1da1f2" },
  { name: "GitHub", hex: "#6e5494" },
  { name: "GitLab", hex: "#fc6d26" },
  { name: "VS Code", hex: "#007acc" },
  { name: "Slack", hex: "#4a154b" },
  { name: "Reddit", hex: "#ff4500" },
  { name: "Netflix", hex: "#e50914" },
  { name: "Slack Purple", hex: "#611f69" },
  { name: "Stripe", hex: "#635bff" },
  { name: "Figma", hex: "#f24e1e" },
];

for (const { name, hex } of brandColors) {
  println([
    { text: name.padEnd(16), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== CYBERPUNK / RETRO ===");
newLine();

const cyberpunkColors = [
  { name: "Matrix Green", hex: "#00ff41" },
  { name: "Terminal Amber", hex: "#ffb000" },
  { name: "Phosphor Green", hex: "#33ff00" },
  { name: "Retro Cyan", hex: "#00f0ff" },
  { name: "Synthwave", hex: "#ff71ce" },
  { name: "Outrun Pink", hex: "#ff00ff" },
  { name: "Vaporwave", hex: "#b4a7d6" },
  { name: "Cyber Blue", hex: "#00ffff" },
  { name: "Hacker Green", hex: "#00ff00" },
  { name: "CRT Green", hex: "#39ff14" },
  { name: "Blood Red", hex: "#8a0303" },
  { name: "Dark Purple", hex: "#4b0082" },
];

for (const { name, hex } of cyberpunkColors) {
  println([
    { text: name.padEnd(16), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== UI / FEEDBACK COLORS ===");
newLine();

const uiColors = [
  { name: "Success Light", hex: "#22c55e" },
  { name: "Success Dark", hex: "#166534" },
  { name: "Warning Light", hex: "#f59e0b" },
  { name: "Warning Dark", hex: "#92400e" },
  { name: "Error Light", hex: "#ef4444" },
  { name: "Error Dark", hex: "#991b1b" },
  { name: "Info Light", hex: "#3b82f6" },
  { name: "Info Dark", hex: "#1e40af" },
  { name: "Primary", hex: "#0ea5e9" },
  { name: "Secondary", hex: "#64748b" },
  { name: "Accent", hex: "#8b5cf6" },
  { name: "Muted", hex: "#9ca3af" },
];

for (const { name, hex } of uiColors) {
  println([
    { text: name.padEnd(16), color: "white" },
    { text: ` ${hex} `, color: hex },
    { text: " ████████ ", color: hex },
  ]);
}

newLine();
println("=== BACKGROUND COLORS ===");
newLine();

const bgColors = [
  { text: " White on Red ", color: "white", bg: "#aa0000" },
  { text: " Black on Yellow ", color: "black", bg: "#ffcc00" },
  { text: " White on Blue ", color: "white", bg: "#0000aa" },
  { text: " Black on Green ", color: "black", bg: "#00aa00" },
];

for (const { text, color, bg } of bgColors) {
  println({ text, color, backgroundColor: bg });
}

newLine();
println("=== GRADIENT DEMONSTRATION ===");
newLine();

const gradient = [
  "#ff0000", // Red
  "#ff4400",
  "#ff8800",
  "#ffcc00",
  "#ffff00", // Yellow
  "#ccff00",
  "#88ff00",
  "#44ff00",
  "#00ff00", // Green
  "#00ff44",
  "#00ff88",
  "#00ffcc",
  "#00ffff", // Cyan
  "#00ccff",
  "#0088ff",
  "#0044ff",
  "#0000ff", // Blue
  "#4400ff",
  "#8800ff",
  "#cc00ff",
  "#ff00ff", // Magenta
  "#ff00cc",
  "#ff0088",
  "#ff0044",
];

let gradientLine: { text: string; color: string }[] = [];
for (const hex of gradient) {
  gradientLine.push({ text: "█", color: hex });
}
println(gradientLine);

newLine();
println({ text: " All colors are available! ", color: "white", backgroundColor: "#444" });
