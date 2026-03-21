
--------------------------------------------------
VIRTUAL_EXTRACTOR (VeX) 
Version: 1.0.0
Author: Empasm
--------------------------------------------------

--- DESCRIPTION ---

VeX is a data extraction and intel utility. It 
scrapes files for specific data types and pipes them into 
LYNX for gathering intelligence.

--- FEATURES ---

- Extraction: Pull Emails, Names, and URLs from any file.
- Direct Scan: Feed lists directly into LYNX tools.
- Auto-Scrubber: Cleans LYNX output of junk headers and 
  "No data found" lines automatically.
- Setup: Auto-verifies and installs LYNX if it's missing.

--- USAGE ---

1. Place 'vex.ts' file in /lib
2. Run: 'vex' in terminal
3. Select a module:
   [1] Emails - Scans for email patterns.
   [2] Names - Scans for names.
   [3] Web Addresses - Scans for URLs/domains.
   [4] Direct Scan - Skips regex; treats every line as a target.
4. Enter the path of the file to scan.
5. Choose to pipe results into LYNX.

--- OUTPUT ---

Cleaned intel is saved to: vex-results.txt

--- NOTES ---

- Module 4 is great for processing employee or domain lists 
  found during recon.