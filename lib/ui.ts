/**
 * UI wrapper for consistent output
 */

const PALETTE = {
  white: "white",
  gray: "gray", 
  pink: "rgb(255, 0, 179)",
  cyan: "rgb(30, 191, 255)",
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ff4c4cff",
  sora: "#ff2056",
  yellow: "#fbbf24",
  purple: "rgba(195, 105, 255, 0.86)",
} as const;

type PaletteColor = keyof typeof PALETTE;

export class UI {
  blockWidth = 64;
  tableWidth = 64;

  static ctx(): UI {
    return new UI();
  }

  print(text: string, color: PaletteColor | string = "gray"): void {
    const c = PALETTE[color as PaletteColor] || color;
    println({ text, color: c });
  }

  info(text: string): void {
    this.print(`[i] ${text}`, "gray");
  }

  success(text: string): void {
    this.print(`[+] ${text}`, "green");
  }

  warn(text: string): void {
    this.print(`[!] ${text}`, "orange");
  }

  error(text: string): void {
    this.print(`[-] ${text}`, "red");
  }

  section(title: string): void {
    this.newLine();
    this.print(title, "white");
    this.divider();
  }

  divider(char = "-", width = this.blockWidth): void {
    this.print(char.repeat(width), "gray");
  }

  newLine(): void {
    println(" ");
  }

  // Print array of styled segments - all colors go through PALETTE
  private printStyled(segments: Array<{text: string, color: string}>): void {
    const resolved = segments.map(s => ({
      text: s.text,
      color: PALETTE[s.color as PaletteColor] || s.color
    }));
    println(resolved);
  }

  printGradient(text: string, colors: PaletteColor[]): void {
    const lines = text.split("\n");
    for (const line of lines) {
      if (!line.trim()) continue;
      const segments = [];
      const charsPerColor = Math.ceil(line.length / colors.length);
      for (let i = 0; i < line.length; i++) {
        const colorIdx = Math.min(Math.floor(i / charsPerColor), colors.length - 1);
        segments.push({ text: line[i], color: PALETTE[colors[colorIdx]] });
      }
      println(segments);
    }
  }

  printBlockTitle(title: string): void {
    const label = `[ ${title} ]`;
    const pad = Math.max(0, this.blockWidth - label.length);
    const left = Math.floor(pad / 2);
    const right = pad - left;

    this.newLine();
    this.divider("=", this.blockWidth);
    this.printStyled([
      { text: " ".repeat(left), color: "yellow" },
      { text: label, color: "white" },
      { text: " ".repeat(right), color: "yellow" },
    ]);
    this.divider("=", this.blockWidth);
  }

  printBlockFooter(): void {
    this.divider("=", this.blockWidth);
    this.newLine();
  }

  // Common row formatting with label + values
  private formatRow(label: string, values: Array<{ text: string; color?: string }>, options?: { labelColor?: string }): void {
    const leftWidth = 15;
    const gap = 2;
    const leftCol = label.padEnd(leftWidth);
    
    const segments = [
      { text: leftCol, color: options?.labelColor || "gray" },
      { text: " ".repeat(gap), color: "gray" },
      ...values.map(v => ({ text: v.text, color: v.color || "gray" }))
    ];
    
    this.printStyled(segments);
  }

  printColumns(left: string, right: string, options: { leftColor?: string; rightColor?: string } = {}): void {
    this.formatRow(left, [{ text: right, color: options.rightColor }], { labelColor: options.leftColor });
  }

  // Subnet with dual colors - both external and internal IPs
  printSubnet(label: string, externalIp: string, internalIp: string, options: { 
    labelColor?: string;
    externalColor?: string; 
    internalColor?: string;
    separatorColor?: string;
  } = {}): void {
    this.formatRow(label, [
      { text: externalIp, color: options.externalColor },
      { text: " / ", color: options.separatorColor },
      { text: internalIp, color: options.internalColor }
    ], { labelColor: options.labelColor });
  }

  table(headers: string[], rows: Array<Record<string, string | number>>, options?: { rowColor?: (row: Record<string, string | number>) => string }): void {
    if (!rows.length) return;
    
    const colWidths = headers.map((h) => {
      const maxData = Math.max(...rows.map((r) => String(r[h] || "").length));
      return Math.max(h.length, maxData) + 2;
    });

    const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join("");
    this.print(headerLine, "white");
    this.divider("-", Math.min(this.tableWidth, headerLine.length));

    for (const row of rows) {
      const rowColor = options?.rowColor?.(row) || "white";
      const line = headers.map((h, i) => String(row[h] || "").padEnd(colWidths[i])).join("");
      const c = PALETTE[rowColor as PaletteColor] || rowColor;
      this.print(line, rowColor as PaletteColor);
    }
  }

  async confirm(label: string): Promise<boolean> {
    const ans = await prompt(`${label} (y/n): `);
    return (ans || "").toLowerCase() === "y";
  }
}
