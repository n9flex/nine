/**
 * sora
 * @app-description Sora is a professional terminal-output library for building clean, consistent CLI experiences.
 *
 * Usage:
 * const out = Sora.ctx();
 * out.print("Hello", "cyan");
 */

const SORA_COLORS = {
  sora: "#ff2056",
  primary: "white",
  secondary: "gray",
  success: "green",
  warning: "yellow",
  error: "red",
  inverted: "black",
  black: "black",
  white: "white",
  gray: "gray",
  red: "red",
  green: "green",
  blue: "blue",
  yellow: "yellow",
  magenta: "magenta",
  cyan: "cyan",
  orange: "orange",
  pink: "pink",
  purple: "purple",
} as const;

type SoraColors = typeof SORA_COLORS;

class SoraCore {
  private _colors: SoraColors = SORA_COLORS;
  blockWidth = 64;
  tableWidth = 64;

  get colors(): SoraColors {
    return this._colors;
  }

  ctx(): SoraCore {
    return this;
  }

  info(text: string): void {
    this.print(`[i] ${text}`, this.colors.secondary);
  }

  warn(text: string): void {
    this.print(`[!] ${text}`, this.colors.warning);
  }

  error(text: string): void {
    this.print(`[-] ${text}`, this.colors.error);
  }

  success(text: string): void {
    this.print(`[+] ${text}`, this.colors.success);
  }

  print(text: string, color: string = this.colors.secondary): void {
    println({ text, color });
  }

  printLn(style: { text: string; color?: string; backgroundColor?: string }): void {
    println({
      text: style.text,
      color: style.color,
      backgroundColor: style.backgroundColor,
    });
  }

  newLine(): void {
    println(" ");
  }

  section(title: string, subtitle = ""): void {
    this.newLine();
    this.print(title, this.colors.primary);
    if (subtitle) this.print(subtitle, this.colors.secondary);
    this.divider("-", this.tableWidth);
  }

  divider(char = "-", width: number = this.blockWidth): void {
    this.print(char.repeat(width), this.colors.secondary);
  }

  list(items: string[], options: { bullet?: string; color?: string } = {}): void {
    const bullet = options.bullet ?? "-";
    const color = options.color ?? this.colors.secondary;
    items.forEach((item) => this.print(`${bullet} ${item}`, color));
  }

  printTable(rows: Array<Record<string, string | number>>, options: {
    padding?: number;
    align?: "left" | "right" | "center";
    columnAlign?: Record<string, "left" | "right" | "center">;
    headerColor?: string;
    rowColor?: string | ((row: Record<string, string | number>) => string);
    columnColors?: Record<string, string | ((value: string, row: Record<string, string | number>) => string | null)>;
  } = {}): void {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const padding = options.padding ?? 2;
    const alignDefault = options.align ?? "left";
    const widths = headers.map((key) =>
      Math.max(
        key.length,
        ...rows.map((row) => String(row[key] ?? "").length)
      )
    );
    const headerColor = options.headerColor ?? this.colors.secondary;
    const rowColorOption = options.rowColor ?? this.colors.primary;

    const padCell = (value: string, width: number, align: "left" | "right" | "center") => {
      if (align === "right") return value.padStart(width);
      if (align === "center") {
        const left = Math.floor((width - value.length) / 2);
        const right = width - value.length - left;
        return " ".repeat(left) + value + " ".repeat(right);
      }
      return value.padEnd(width);
    };

    const joiner = " ".repeat(padding);
    const headerLine = headers
      .map((key, idx) => padCell(key, widths[idx], options.columnAlign?.[key] ?? alignDefault))
      .join(joiner);
    this.print(headerLine, headerColor);

    rows.forEach((row) => {
      const rowColor = typeof rowColorOption === "function" ? rowColorOption(row) : rowColorOption;
      const segments = headers.map((key, idx) => {
        const value = String(row[key] ?? "");
        const align = options.columnAlign?.[key] ?? alignDefault;
        const text = padCell(value, widths[idx], align);
        const columnColor = options.columnColors?.[key];
        let color = rowColor;
        if (typeof columnColor === "function") {
          const resolved = columnColor(value, row);
          if (resolved) color = resolved;
        } else if (columnColor) {
          color = columnColor;
        }
        return { text, color };
      });

      const payload = segments.flatMap((seg, idx) => {
        const items = [seg];
        if (idx < segments.length - 1) {
          items.push({ text: joiner, color: rowColor });
        }
        return items;
      });

      println(payload);
    });
  }

  async promptText(label: string): Promise<string> {
    const value = await prompt(label);
    return value || "";
  }
}

export const Sora = new SoraCore();
export type SoraOut = SoraCore;
