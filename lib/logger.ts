/**
 * Logger - Aggregates results and generates reports
 */

export interface ScanResult {
  type: "port" | "wifi" | "exploit" | "brute" | "dump";
  target: string;
  status: "success" | "failure" | "info";
  data: Record<string, unknown>;
  timestamp: number;
}

export class Logger {
  private target = "";
  private results: ScanResult[] = [];
  private startTime = Date.now();

  setTarget(ip: string): void {
    this.target = ip;
    this.startTime = Date.now(); // Reset timer when scan starts
  }

  log(result: Omit<ScanResult, "timestamp">): void {
    this.results.push({ ...result, timestamp: Date.now() });
  }

  logPort(port: number, service: string, version: string, isOpen: boolean): void {
    this.log({
      type: "port",
      target: `${this.target}:${port}`,
      status: isOpen ? "success" : "info",
      data: { port, service, version, isOpen },
    });
  }

  async getReportPath(): Promise<string> {
    return `loot/${this.target}/scan.txt`;
  }

  async saveReport(): Promise<void> {
    const lootPath = `loot/${this.target}`;
    await FileSystem.Mkdir(lootPath, { recursive: true });

    const lines: string[] = [
      ...this.generateHeader(),
      ...this.generatePortsSection(),
      ...this.generateExploitsSection(),
      ...this.generateDumpsSection(),
      ...this.generateSummary(),
    ];

    const reportPath = `${lootPath}/scan.txt`;
    await FileSystem.WriteFile(reportPath, lines.join("\n"));
  }

  private generateHeader(): string[] {
    return [
      "========================================",
      "         NINE SCAN REPORT               ",
      "========================================",
      "",
      `Target: ${this.target}`,
      `Duration: ${((Date.now() - this.startTime) / 1000).toFixed(1)}s`,
      `Timestamp: ${new Date().toISOString()}`,
      "",
      "========================================",
      "",
    ];
  }

  private generatePortsSection(): string[] {
    const ports = this.results.filter((r) => r.type === "port");
    if (!ports.length) return [];

    const lines: string[] = ["[PORTS]"];
    const openPorts = ports.filter((p) => p.data.isOpen);
    const closedPorts = ports.filter((p) => !p.data.isOpen);

    if (openPorts.length) {
      lines.push("", "Open:");
      openPorts.forEach((p) => {
        lines.push(`  ${p.data.port}/tcp open ${p.data.service} ${p.data.version}`);
      });
    }

    if (closedPorts.length) {
      lines.push("", "Closed:");
      closedPorts.forEach((p) => {
        lines.push(`  ${p.data.port}/tcp closed ${p.data.service} ${p.data.version}`);
      });
    }

    lines.push("");
    return lines;
  }

  private generateExploitsSection(): string[] {
    const exploits = this.results.filter((r) => r.type === "exploit");
    if (!exploits.length) return [];

    const lines: string[] = ["[EXPLOITATION]"];
    exploits.forEach((e) => {
      const icon = e.status === "success" ? "✓" : "✗";
      lines.push(`  ${icon} ${e.target} - ${e.status}`);
    });
    lines.push("");
    return lines;
  }

  private generateDumpsSection(): string[] {
    const dumps = this.results.filter((r) => r.type === "dump");
    if (!dumps.length) return [];

    const lines: string[] = ["[DUMPED DATA]"];
    dumps.forEach((d) => {
      lines.push(`  ${d.target}:`);
      Object.entries(d.data).forEach(([k, v]) => {
        lines.push(`    ${k}: ${v}`);
      });
    });
    lines.push("");
    return lines;
  }

  private generateSummary(): string[] {
    return [
      "========================================",
      "",
      "SUMMARY:",
      `  Total operations: ${this.results.length}`,
      `  Successful: ${this.results.filter((r) => r.status === "success").length}`,
      `  Failed: ${this.results.filter((r) => r.status === "failure").length}`,
      "",
      "--- End of Report ---",
    ];
  }
}
