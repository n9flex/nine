// @ts-nocheck
// ============================================================================
// SECTION: Imports
// ============================================================================

// Uses global HackHub APIs: println, printTable

// ============================================================================
// SECTION: Color Palette
// ============================================================================

export const COLOR_PALETTE = {
  white: "#ffffff",
  gray: "#6b7280",
  pink: "rgb(255, 0, 179)",
  cyan: "rgb(30, 191, 255)",
  green: "#22c55e",
  orange: "#f59e0b",
  red: "#ff4c4cff",
  purple: "rgba(195, 105, 255, 0.86)",
  yellow: "#fbbf24"
} as const;

// ============================================================================
// SECTION: UI Class
// ============================================================================

export class UI {
  private static instance: UI | null = null;

  static ctx(): UI {
    if (!UI.instance) {
      UI.instance = new UI();
    }
    return UI.instance;
  }

  // ============================================================================
  // SECTION: Message Methods
  // ============================================================================

  info(msg: string): void {
    println([{ text: "[i] ", color: COLOR_PALETTE.gray }, { text: msg, color: COLOR_PALETTE.gray }]);
  }

  success(msg: string): void {
    println([{ text: "[+] ", color: COLOR_PALETTE.green }, { text: msg, color: COLOR_PALETTE.green }]);
  }

  warn(msg: string): void {
    println([{ text: "[!] ", color: COLOR_PALETTE.orange }, { text: msg, color: COLOR_PALETTE.orange }]);
  }

  error(msg: string): void {
    println([{ text: "[-] ", color: COLOR_PALETTE.red }, { text: msg, color: COLOR_PALETTE.red }]);
  }

  // ============================================================================
  // SECTION: Layout Methods
  // ============================================================================

  section(title: string): void {
    println([{ text: "═══ ", color: COLOR_PALETTE.purple }, { text: title.toUpperCase(), color: COLOR_PALETTE.purple }, { text: " ═══", color: COLOR_PALETTE.purple }]);
  }

  divider(): void {
    println([{ text: "─".repeat(50), color: COLOR_PALETTE.gray }]);
  }

  // ============================================================================
  // SECTION: Print Methods
  // ============================================================================

  print(label: string, value?: string, colors?: { label?: string; value?: string }): void {
    const labelColor = colors?.label || COLOR_PALETTE.white;
    const valueColor = colors?.value || COLOR_PALETTE.cyan;
    
    if (value !== undefined) {
      println([{ text: `${label}: `, color: labelColor }, { text: value, color: valueColor }]);
    } else {
      println([{ text: label, color: labelColor }]);
    }
  }

  // ============================================================================
  // SECTION: Table Method
  // ============================================================================

  table(headers: string[], rows: Array<Record<string, unknown>>, options?: { rowColor?: (row: Record<string, unknown>) => string }): void {
    if (rows.length === 0) {
      this.info("No data to display");
      return;
    }

    const tableData = rows.map(row => {
      const rowObj: Record<string, unknown> = {};
      for (const header of headers) {
        rowObj[header] = row[header] ?? "";
      }
      return rowObj;
    });

    printTable(tableData);
  }
}
