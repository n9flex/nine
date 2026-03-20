// lynxParser.ts
// Entrypoint of Lynx Search Result parsing
// Author: Marreco

import { ScanResult } from "../models/scanResultM";

export namespace LynxParser {
    type Section = "social" | "contact" | "ip" | "address" | "additional";

    const SECTION_HEADERS: Array<{ re: RegExp; section: Section }> = [
        { re: /Scanning social media platforms\.\.\./i, section: "social" },
        { re: /Searching for contact information\.\.\./i, section: "contact" },
        { re: /Checking for IP address activity\.\.\./i, section: "ip" },
        { re: /Locating physical address\.\.\./i, section: "address" },
        { re: /Searching web for additional information\.\.\./i, section: "additional" },
    ];

    const NO_DATA_RE = /^No data found\.\s*$/i;

    function normalizeBlock(blockLines: string[]): string[] {
        const output: string[] = [];
        for (const line of blockLines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed.includes("...")) continue;
            output.push(trimmed);
        }
        return output;
    }

    function matchSectionHeader(line: string): Section | null {
        for (const h of SECTION_HEADERS) {
            if (h.re.test(line)) return h.section;
        }
        return null;
    }

    function pushUnique(target: string[], items: string[]) {
        for (const it of items) {
            const v = it.trim();
            if (!v) continue;
            if (target.indexOf(v) === -1) target.push(v);
        }
    }

    function parseSocial(lines: string[]): string[] {
        const handles: string[] = [];

        for (const line of lines) {
            if (NO_DATA_RE.test(line)) continue;

            // Prefer extracting @something (handle can include dots/underscores/hyphens and even email-like per your example)
            // We keep the @ prefix, because it's the "important information" you mentioned.
            const matches = line.match(/@\S+/g);
            if (matches) {
                for (const m of matches) {
                    // clean trailing punctuation
                    const cleaned = m.replace(/[),.;:]+$/g, "");
                    handles.push(cleaned);
                }
                continue;
            }

            // Fallback: if there's "Accounts :" but no @, keep the remainder (optional)
            // If you truly ONLY want @ids, comment this out.
            // const acc = extractAfterLabel(line, ["Accounts", "Account", "Social", "Profile"]);
            // if (acc) handles.push(acc);
        }

        return handles;
    }

    export async function parseOutput(raw: string, q: string): Promise<ScanResult> {
        const lines = raw.split("\n").map(l => l.replace(/\r/g, ""));

        const result: ScanResult = {
            query: q,
            social: [],
            contact: [],
            ip: [],
            address: [],
            additional: []
        };

        let currentSection: Section | null = null;
        let buffer: string[] = [];

        const flush = () => {
            if (!currentSection) {
                buffer = [];
                return;
            }

            const cleaned = normalizeBlock(buffer);
            if (cleaned.length === 0) {
                buffer = [];
                return;
            }

            if (NO_DATA_RE.test(cleaned.join("\n").trim())) {
                buffer = [];
                return;
            }

            // Section-specific parsing
            switch (currentSection) {
                case "social":
                    pushUnique(result.social, parseSocial(cleaned));
                    break;
                // case "contact":
                //     pushUnique(result.contact, parseContact(cleaned));
                //     break;
                // case "ip":
                //     pushUnique(result.ip, parseIPs(cleaned));
                //     break;
                // case "address":
                //     pushUnique(result.address, parseAddress(cleaned));
                //     break;
                // case "additional":
                //     pushUnique(result.additional, parseAdditional(cleaned));
                //     break;
            }

            buffer = [];
        };

        for (let i = 0; i < lines.length; i++) {
            const rawLine = lines[i];
            const line = rawLine.trim();

            // Detect section start
            const headerMatch = matchSectionHeader(line);
            if (headerMatch) {
                // finalize previous section
                flush();
                currentSection = headerMatch;
                continue;
            }

            // Ignore global header noise
            if (!currentSection) continue;

            // If a new header is not found, accumulate section lines
            // Stop accumulating if we hit obvious separators that belong to formatting
            // (We still keep dashed lines for additional parsing if needed)
            if (line.length === 0) {
                // blank line -> section ended in many outputs
                flush();
                currentSection = currentSection; // keep section unless next header appears
                continue;
            }

            buffer.push(rawLine);
        }

        // Flush last section
        flush();

        return result;
    }
}