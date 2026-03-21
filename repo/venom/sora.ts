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
  /**
   * Named color palette.
   * @type {SoraColors}
   */
  private _colors: SoraColors = SORA_COLORS;
  blockWidth = 64;
  tableWidth = 64;

  /**
   * Named color palette.
   * @returns {Record<string, string>}
   */
  get colors(): SoraColors {
    return this._colors;
  }

  /**
   * Returns the Sora context (this instance).
   * @returns {SoraCore}
   */
  ctx(): SoraCore {
    return this;
  }

  /**
   * Print info message.
   * @param {string} text - Message text.
   * @returns {void}
   */
  info(text: string): void {
    this.print(`[i] ${text}`, this.colors.secondary);
  }

  /**
   * Print warning message.
   * @param {string} text - Message text.
   * @returns {void}
   */
  warn(text: string): void {
    this.print(`[!] ${text}`, this.colors.warning);
  }

  /**
   * Print error message.
   * @param {string} text - Message text.
   * @returns {void}
   */
  error(text: string): void {
    this.print(`[-] ${text}`, this.colors.error);
  }

  /**
   * Print success message.
   * @param {string} text - Message text.
   * @returns {void}
   */
  success(text: string): void {
    this.print(`[+] ${text}`, this.colors.success);
  }

  /**
   * Print fatal error and throw.
   * @param {string} text - Message text.
   * @returns {never}
   */
  fatal(text: string): never {
    this.print(`[-] ${text}`, this.colors.error);
    throw new Error(text);
  }

  /**
   * Print a line with optional color.
   * @param {string} text - Text to print.
   * @param {string} [color] - Optional output color (name or hex).
   * @returns {void}
   */
  print(text: string, color: string = this.colors.secondary): void {
    println({ text, color });
  }

  /**
   * Print a styled line with optional background.
   * @param {{text: string, color?: string, backgroundColor?: string}} style - Style definition.
   * @returns {void}
   */
  printLn(style: { text: string; color?: string; backgroundColor?: string }): void {
    println({
      text: style.text,
      color: style.color,
      backgroundColor: style.backgroundColor,
    });
  }

  /**
   * Print a blank line.
   * @returns {void}
   */
  newLine(): void {
    println(" ");
  }

  /**
   * Set block width for dividers and titles.
   * @param {number} width - Width in characters.
   * @returns {void}
   */
  setBlockWidth(width: number): void {
    if (Number.isNaN(width) || width <= 0) return;
    this.blockWidth = Math.floor(width);
  }

  /**
   * Set table width for divider defaults.
   * @param {number} width - Width in characters.
   * @returns {void}
   */
  setTableWidth(width: number): void {
    if (Number.isNaN(width) || width <= 0) return;
    this.tableWidth = Math.floor(width);
  }

  /**
   * Print section header with optional subtitle.
   * @param {string} title - Section title.
   * @param {string} [subtitle] - Subtitle.
   * @returns {void}
   */
  section(title: string, subtitle = ""): void {
    this.newLine();
    this.print(title, this.colors.primary);
    if (subtitle) this.print(subtitle, this.colors.secondary);
    this.divider("-", this.tableWidth);
  }

  /**
   * Print divider line.
   * @param {string} [char] - Divider character.
   * @param {number} [width] - Divider width.
   * @returns {void}
   */
  divider(char = "-", width: number = this.blockWidth): void {
    this.print(char.repeat(width), this.colors.secondary);
  }

  /**
   * Print a titled block header.
   * @param {string} title - Title text.
   * @returns {void}
   */
  printBlockTitle(title: string): void {
    const label = `[ ${title} ]`;
    const pad = Math.max(0, this.blockWidth - label.length);
    const left = Math.floor(pad / 2);
    const right = pad - left;

    this.newLine();
    this.divider("=", this.blockWidth);
    println([
      { text: " ".repeat(left), color: this.colors.warning },
      { text: label, color: this.colors.primary },
      { text: " ".repeat(right), color: this.colors.warning },
    ]);
    this.divider("=", this.blockWidth);
  }

  /**
   * Print a block footer.
   * @returns {void}
   */
  printBlockFooter(): void {
    this.divider("=", this.blockWidth);
    this.newLine();
  }

  /**
   * Print a badge label.
   * @param {string} text - Badge text.
   * @param {string} [color] - Text color.
   * @param {string} [backgroundColor] - Background color.
   * @returns {void}
   */
  badge(text: string, color: string = this.colors.white, backgroundColor?: string): void {
    this.printLn({ text: ` ${text} `, color, backgroundColor });
  }

  /**
   * Print two columns on a single line.
   * @param {string} left - Left column text.
   * @param {string} right - Right column text.
   * @param {{gap?: number, leftWidth?: number, rightWidth?: number, leftColor?: string, rightColor?: string}} [options] - Column options.
   * @returns {void}
   */
  printColumns(left: string, right: string, options: {
    gap?: number;
    leftWidth?: number;
    rightWidth?: number;
    leftColor?: string;
    rightColor?: string;
  } = {}): void {
    const gap = options.gap ?? 2;
    const leftWidth = options.leftWidth ?? Math.floor((this.tableWidth - gap) * 0.6);
    const rightWidth = options.rightWidth ?? (this.tableWidth - gap - leftWidth);
    const leftText = this.align(left, leftWidth, "left");
    const rightText = this.align(right, rightWidth, "right");

    println([
      { text: leftText, color: options.leftColor ?? this.colors.secondary },
      { text: " ".repeat(gap), color: this.colors.secondary },
      { text: rightText, color: options.rightColor ?? this.colors.secondary },
    ]);
  }

  /**
   * Align text within a fixed width.
   * @param {string} text - Text to align.
   * @param {number} width - Target width.
   * @param {"left" | "right" | "center"} mode - Alignment mode.
   * @returns {string}
   */
  align(text: string, width: number, mode: "left" | "right" | "center" = "left"): string {
    if (mode === "right") return text.padStart(width).slice(-width);
    if (mode === "center") {
      const pad = Math.max(0, width - text.length);
      const left = Math.floor(pad / 2);
      const right = pad - left;
      return `${" ".repeat(left)}${text}${" ".repeat(right)}`.slice(0, width);
    }
    return text.padEnd(width).slice(0, width);
  }

  /**
   * Print a titled block with content lines.
   * @param {string} title - Block title.
   * @param {string[]} lines - Content lines.
   * @returns {void}
   */
  block(title: string, lines: string[]): void {
    this.printBlockTitle(title);
    lines.forEach((line) => this.print(line, this.colors.secondary));
    this.printBlockFooter();
  }

  /**
   * Print a table from headers and row arrays.
   * @param {string[]} headers - Column headers.
   * @param {Array<Array<string | number>>} rows - Row values.
   * @param {{
   *   padding?: number,
   *   align?: "left" | "right" | "center",
   *   columnAlign?: Record<string, "left" | "right" | "center">,
   *   headerColor?: string,
   *   rowColor?: string | ((row: Record<string, string | number>) => string),
   *   columnColors?: Record<string, string | ((value: string, row: Record<string, string | number>) => string | null)>
   * }} [options] - Table options.
   * @returns {void}
   */
  tableFromArray(
    headers: string[],
    rows: Array<Array<string | number>>,
    options: {
      padding?: number;
      align?: "left" | "right" | "center";
      columnAlign?: Record<string, "left" | "right" | "center">;
      headerColor?: string;
      rowColor?: string | ((row: Record<string, string | number>) => string);
      columnColors?: Record<string, string | ((value: string, row: Record<string, string | number>) => string | null)>;
    } = {}
  ): void {
    const mapped = rows.map((row) =>
      headers.reduce<Record<string, string | number>>((acc, header, idx) => {
        acc[header] = row[idx] ?? "";
        return acc;
      }, {})
    );
    this.printTable(mapped, options);
  }

  /**
   * Print a list.
   * @param {string[]} items - List items.
   * @param {{bullet?: string, color?: string}} [options] - List options.
   * @returns {void}
   */
  list(items: string[], options: { bullet?: string; color?: string } = {}): void {
    const bullet = options.bullet ?? "-";
    const color = options.color ?? this.colors.secondary;
    items.forEach((item) => this.print(`${bullet} ${item}`, color));
  }

  /**
   * Print a numbered list.
   * @param {string[]} items - List items.
   * @param {{bullet?: string, color?: string}} [options] - List options.
   * @returns {void}
   */
  listNumbers(items: string[], options: { bullet?: string; color?: string } = {}): void {
    const color = options.color ?? this.colors.secondary;
    items.forEach((item, index) => this.print(`${index + 1}. ${item}`, color));
  }

  /**
   * Print key/value pairs.
   * @param {Record<string, string | number>} pairs - Key/value map.
   * @returns {void}
   */
  kv(pairs: Record<string, string | number>): void {
    const keys = Object.keys(pairs);
    const width = Math.max(...keys.map((k) => k.length), 1);
    keys.forEach((key) => {
      const value = String(pairs[key]);
      this.print(`${key.padEnd(width)} : ${value}`, this.colors.secondary);
    });
  }

  /**
   * Print key/value pairs as a 2-column table.
   * @param {Record<string, string | number>} pairs - Key/value map.
   * @param {object} [options] - Table options.
   * @returns {void}
   */
  tableFromPairs(pairs: Record<string, string | number>, options: {
    padding?: number;
    align?: "left" | "right" | "center";
    columnAlign?: Record<string, "left" | "right" | "center">;
    headerColor?: string;
    rowColor?: string | ((row: Record<string, string | number>) => string);
    columnColors?: Record<string, string | ((value: string, row: Record<string, string | number>) => string | null)>;
  } = {}): void {
    const rows = Object.entries(pairs).map(([key, value]) => ({ Key: key, Value: value }));
    this.printTable(rows, options);
  }

  /**
   * Print a simple table from an array of objects.
   * @param {Array<Record<string, string | number>>} rows - Table rows.
   * @param {{
   *   padding?: number,
   *   align?: "left" | "right" | "center",
   *   columnAlign?: Record<string, "left" | "right" | "center">,
   *   headerColor?: string,
   *   rowColor?: string,
   *   columnColors?: Record<string, string | ((value: string, row: Record<string, string | number>) => string | null)>
   * }} [options] - Table options.
   * @returns {void}
   */
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

  /**
   * Prompt for text input.
   * @param {string} label - Prompt label.
   * @returns {Promise<string>}
   */
  async promptText(label: string): Promise<string> {
    const value = await prompt(label);
    return value || "";
  }

  /**
   * Prompt for password input.
   * @param {string} label - Prompt label.
   * @returns {Promise<string>}
   */
  async promptPassword(label: string): Promise<string> {
    const value = await prompt({ label, password: true });
    return value || "";
  }

  /**
   * Prompt for text input with validation.
   * @param {string} label - Prompt label.
   * @param {{defaultValue?: string, required?: boolean, retries?: number, validate?: (value: string) => string | null}} [options] - Prompt options.
   * @returns {Promise<string>}
   */
  async promptTextValidated(label: string, options: {
    defaultValue?: string;
    required?: boolean;
    retries?: number;
    validate?: (value: string) => string | null;
  } = {}): Promise<string> {
    const retries = options.retries ?? 2;
    for (let attempt = 0; attempt <= retries; attempt++) {
      const value = (await prompt(label)) || "";
      const finalValue = value.trim() === "" ? options.defaultValue ?? value : value;

      if (options.required && finalValue.trim() === "") {
        this.warn("Value required");
        continue;
      }

      if (options.validate) {
        const error = options.validate(finalValue);
        if (error) {
          this.warn(error);
          continue;
        }
      }

      return finalValue;
    }

    return options.defaultValue ?? "";
  }

  /**
   * Prompt for a number with optional validation.
   * @param {string} label - Prompt label.
   * @param {{defaultValue?: string, required?: boolean, retries?: number, validate?: (value: string) => string | null}} [options] - Prompt options.
   * @returns {Promise<number | null>}
   */
  async promptNumber(label: string, options: {
    defaultValue?: string;
    required?: boolean;
    retries?: number;
    validate?: (value: string) => string | null;
  } = {}): Promise<number | null> {
    const value = await this.promptTextValidated(label, options);
    if (value.trim() === "") return null;
    const num = Number.parseFloat(value);
    if (Number.isNaN(num)) {
      this.warn("Invalid number");
      return null;
    }
    return num;
  }

  /**
   * Prompt the user to choose from a list of options.
   * @param {string} label - Prompt label.
   * @param {string[]} options - Options list.
   * @param {{defaultIndex?: number, retries?: number}} [opts] - Choice options.
   * @returns {Promise<number>}
   */
  async promptChoice(label: string, options: string[], opts: {
    defaultIndex?: number;
    retries?: number;
  } = {}): Promise<number> {
    const retries = opts.retries ?? 2;
    if (!options.length) return 0;
    this.listNumbers(options, { color: this.colors.secondary });
    for (let attempt = 0; attempt <= retries; attempt++) {
      const value = await prompt(label);
      const raw = (value || "").trim();
      if (!raw && opts.defaultIndex && opts.defaultIndex > 0) {
        return opts.defaultIndex;
      }
      const pick = Number.parseInt(raw, 10);
      if (!Number.isNaN(pick) && pick >= 1 && pick <= options.length) {
        return pick;
      }
      this.warn("Invalid selection");
    }
    return opts.defaultIndex ?? 0;
  }
}

/**
 * Singleton Sora instance for direct imports.
 * @example
 * import { Sora } from "./sora";
 * const out = Sora.ctx();
 * out.info("Ready for output helpers");
 */
export const Sora = new SoraCore();
