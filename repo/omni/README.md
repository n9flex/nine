OMNI v3.0 — Unified Hacking Toolkit
=====================================

All-in-one OSINT, recon, exploitation, cracking, brute force,
and full-spectrum attack pipeline.

SETUP:
  1. Clone the repo
  2. cd omni
  3. Run: node install.ts
  4. Done! Use 'omni' from anywhere.

FEATURES:
  - Auto-downloads required scripts from HackDB on first run
    (net_tree.py, pyUserEnum.py, fern.py, kimai.py, pret.py,
     sqlmap.py, jwt_decoder.py, wordlist.lst)
  - Auto mode (-a) skips all prompts and picks defaults
  - Stops after successful exploit (no unnecessary brute force)
  - Handles routers, firewalls, printers, and standard devices

USAGE:
  omni <ip>                     Deep recon + exploit
  omni <ip> -a                  Full auto (no prompts)
  omni <ip>,<ip>,<ip>           Attack multiple IPs
  omni -t <file>                Attack IPs from file
  omni <domain>                 Resolve domain → IP → recon
  omni -e <email>               Email → IP → exploit
  omni -j <jwt_token>           Decode JWT token
  omni -f <filepath> [1-4]      Extract from file (VEX)
  omni -l <search_term>         Lynx OSINT lookup
  omni -l <term> -d <depth>     Recursive harvest
  omni -w                       WiFi crack pipeline
  omni -c <hash>                Crack a hash (direct + john + hashcat)
  omni --crack-file <file>      Crack hashes from file
  omni -s <url>                 SQL injection (sqlmap)
  omni -p                       View saved target profiles
  omni --full <target>          FULL ATTACK PIPELINE (everything)
  omni --nettree <ip>           Network tree discovery
  omni --subfinder <domain>     Subdomain enumeration
  omni --mx <domain>            Mail server lookup
  omni --geoip <ip>             Geolocation lookup
  omni --nuclei <targets>       Vulnerability scan
  omni -h                       Show help

FILE EXTRACT MODES (with -f):
  1 = Emails  2 = Names  3 = URLs  4 = Direct (all lines)

FLAGS:
  -a          Auto mode (skip prompts, pick defaults)
  -d <1-5>    Recursive depth (default 3, max 5)

IP PIPELINE FLOW:
  1. Network tree (net_tree.py)
  2. Geoip lookup
  3. User enumeration (pyUserEnum.py)
  4. Whois + Dig
  5. NTLM check
  6. Subnet detection + device type handling
  7. Port scan + nmap verification
  8. Exploitation (Metasploit, auto-selects in -a mode)
  9. Brute force with hydra (only if exploit fails)

DEVICE HANDLERS:
  ROUTER   → Opens browser + fern.py for credential cracking
  FIREWALL → Wireshark + kimai.py for packet capture + hash decode
  PRINTER  → pret.py for printer exploitation
  DEVICE   → Standard port scan + Metasploit exploit

MODULES:
  modules/ip.ts          - IP recon + port scanning
  modules/lynx.ts        - Recursive OSINT harvest
  modules/exploit.ts     - Metasploit automation
  modules/jwt.ts         - JWT decode
  modules/file.ts        - File extraction (VEX)
  modules/domain.ts      - Domain resolution
  modules/email.ts       - Email WHOIS recon
  modules/wifi.ts        - WiFi cracking
  modules/crack.ts       - Hash cracking (direct + john + hashcat)
  modules/sqli.ts        - SQL injection
  modules/profile.ts     - Target profiles
  modules/nettree.ts     - Network tree discovery
  modules/recon.ts       - Extended recon (subfinder, mx, geoip, nuclei)
  modules/brute.ts       - Brute force (hydra)
  modules/postexploit.ts - Post-exploitation (rootgrab)
  modules/fullpipeline.ts - Full attack pipeline orchestrator
