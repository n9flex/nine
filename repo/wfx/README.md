--------------------------------------------------
WFX_EXTRACTOR (WFX) 
Version: 1.2
Author: Empasm
--------------------------------------------------

--- CREDITS ---

- Base logic and styling by Empasm.
- Batch Attack implementation inspired by And's tool.
  - Just released since they couldn't at the time

--- DESCRIPTION ---

Important: WFX only uses the default in game example
for handling wifi, wrapped with a pretty UI

WFX is a high-speed wireless auditing and handshake 
interception utility. It automates the reconnaissance, 
deauthentication, and decryption process for WiFi targets.

--- FEATURES ---

- Recon: Active scanning for BSSID, Signal, and SSID.
- Signal Grading: Dynamic color-coding based on signal 
  integrity (Green = Strong, Red = Weak).
- Auto-Deauth: Forces client disconnection to trigger 
  WPA handshake broadcasts.
- Handshake Cache: Seamlessly captures and pipes PCAP 
  data into Hashcat for decryption.
- Batch Mode: Automated sequential auditing of all 
  detected networks, sorted by signal priority.

--- USAGE ---

Node is required: apt-get install node

1. Place 'wfx.ts' file in /lib
2. Run: 'wfx' in terminal
3. The system auto-detects Monitor Mode interfaces.
4. Select Mode:
   [1] SINGLE: Target a specific network ID.
   [2] BATCH: Automatically cycle through every AP found.
5. WFX will automatically:
   - Decrypt and display keys in a formatted table.

--- OUTPUT ---

Results are displayed in a Signal-Prioritized Table. 
Recovered keys can be exported to a local .txt log 
following a Batch session.