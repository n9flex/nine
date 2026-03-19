/**
 * sora-example
 * Basic and advanced usage examples.
 */

import { Sora } from "./sora";

const out = Sora.ctx();

// ==========================
// BASIC EXAMPLES
// ==========================

// Simple prints
out.print("Hello", "cyan");
out.printLn({ text: "Success!", color: "green" });
out.printLn({ text: "Alert", color: "white", backgroundColor: "#333" });
out.newLine();

// Banner with color
out.print(
  String.raw`
      ___           ___           ___           ___     
     /\__\         /\  \         /\  \         /\  \    
    /:/ _/_       /::\  \       /::\  \       /::\  \   
   /:/ /\  \     /:/\:\  \     /:/\:\__\     /:/\:\  \  
  /:/ /::\  \   /:/  \:\  \   /:/ /:/  /    /:/ /::\  \ 
 /:/_/:/\:\__\ /:/__/ \:\__\ /:/_/:/__/___ /:/_/:/\:\__\
 \:\/:/ /:/  / \:\  \ /:/  / \:\/:::::/  / \:\/:/  \/__/
  \::/ /:/  /   \:\  /:/  /   \::/~~/~~~~   \::/__/     
   \/_/:/  /     \:\/:/  /     \:\~~\        \:\  \     
     /:/  /       \::/  /       \:\__\        \:\__\    
     \/__/         \/__/         \/__/         \/__/    
`,
  out.colors.sora
);
out.newLine();

// Simple lists
out.list(["Scan", "Collect", "Report"], { bullet: "-", color: "cyan" });
out.listNumbers(["First", "Second", "Third"], { color: "yellow" });
out.newLine();

// Basic tables
out.printTable([
  { Name: "SSH", Port: 22, Status: "open" },
  { Name: "HTTP", Port: 80, Status: "closed" },
]);
out.newLine();

// ==========================
// ADVANCED EXAMPLES
// ==========================

out.setBlockWidth(60);
out.setTableWidth(60);

// Section + badges + columns
out.section("SPRA DEMO", "Advanced output helpers");
out.badge("READY", out.colors.white, "green");
out.printColumns("Target", "192.168.1.5", { rightColor: out.colors.cyan });
out.printColumns("Latency", "23ms", { rightColor: out.colors.green });
out.divider("=", 60);

// Message helpers
out.info("Info message");
out.success("Success message");
out.warn("Warning message");
out.error("Error message");
out.newLine();

// Key/value + table from pairs
out.section("KEY/VALUE");
out.kv({ Target: "node-12", Region: "us-east", Attempts: 3 });
out.tableFromPairs({ Host: "node-12", Role: "gateway", Uptime: "21h" }, { headerColor: out.colors.yellow });
out.tableFromArray([
  "Metric",
  "Value",
], [
  ["Latency", "24ms"],
  ["Packets", 128],
]);
out.newLine();

// Advanced tables with per-column colors
out.section("TABLES");
out.printTable([
  { Port: 22, Service: "ssh", Status: "open" },
  { Port: 80, Service: "http", Status: "closed" },
  { Port: 443, Service: "https", Status: "open" },
], {
  columnAlign: { Port: "right" },
  headerColor: out.colors.yellow,
  columnColors: {
    Status: (value) => (value === "open" ? out.colors.green : out.colors.red),
  },
});
out.printTable([
  { Name: "alpha", Score: 7, Status: "ok" },
  { Name: "beta", Score: 13, Status: "warn" },
  { Name: "gamma", Score: 2, Status: "fail" },
], {
  align: "center",
  padding: 4,
  columnAlign: { Score: "right" },
  headerColor: out.colors.cyan,
  rowColor: out.colors.white,
});
out.newLine();

// Blocks and styled lines
out.section("BLOCKS");
out.printBlockTitle("SCAN SUMMARY");
out.printLn({ text: "Ports scanned: 3", color: out.colors.white });
out.printLn({ text: "Open: 2 | Closed: 1", color: out.colors.cyan });
out.printBlockFooter();
out.block("NOTES", ["Use safe mode", "Rotate targets", "Store logs"]);

out.section("STYLED LINES");
out.printLn({ text: "Hex background", color: out.colors.white, backgroundColor: "#1d4ed8" });
out.printLn({ text: "Named background", color: out.colors.black, backgroundColor: "yellow" });
out.printLn({ text: "Custom text color", color: "#f97316" });
out.newLine();

// Divider styles
out.section("DIVIDERS");
out.divider("-", 60);
out.divider("=", 60);
out.divider(".", 60);
out.divider("*", 60);

// Alignment helper
out.section("ALIGN");
out.print(out.align("left", 20, "left"), out.colors.cyan);
out.print(out.align("center", 20, "center"), out.colors.yellow);
out.print(out.align("right", 20, "right"), out.colors.green);

// Prompts with validation (keep prompts at the end)
out.section("PROMPTS");
const alias = await out.promptText("Alias: ");
const operator = await out.promptTextValidated("Operator name: ", {
  defaultValue: "anon",
  validate: (value) => (value.length < 3 ? "Use 3+ chars" : null),
});
const retries = await out.promptNumber("Retries (0-5): ", {
  defaultValue: "3",
  validate: (value) => {
    const num = Number.parseInt(value, 10);
    return Number.isNaN(num) || num < 0 || num > 5 ? "Use 0-5" : null;
  },
});
const password = await out.promptPassword("Password: ");
const modes = ["silent", "normal", "verbose"];
const modeIndex = await out.promptChoice("Select mode: ", modes, { defaultIndex: 2 });
const mode = modes[modeIndex - 1] || "unknown";
out.kv({
  Alias: alias || "(none)",
  Operator: operator,
  Retries: retries ?? "n/a",
  Mode: mode,
  Password: password ? "[hidden]" : "(none)",
});
out.newLine();

// Fatal (handled so the demo continues)
out.section("FATAL");
try {
  out.fatal("Demo fatal error");
} catch (error) {
  out.warn("Recovered from fatal demo");
}
