--------------------------------------------------
EFX TOOLKIT (EFX) 
Version: 1.1
Author: Empasm
--------------------------------------------------

--- DESCRIPTION ---
    A streamlined script for jumping from email recon 
    to system access and token decryption.

--- FEATURES ---
  - Recon: Automated WHOIS to IP mapping.
  - Port Scanning: Integrated service and version detection.
  - Priority Targeting: Auto-selects vulnerable services 
    (Apache/OpenSSH) when running in Auto-Mode.
  - Dynamic Exploitation: Native Metasploit integration 
    for direct payload delivery.
  - JWT Decoding: Automated HackDB retrieval for decoders 
    to extract passwords from captured session tokens.

--- USAGE ---

  Node is required: apt-get install node. 
  All other requirements will be downloaded automatically

    1. Target an email:
       efx -e email@domain.com
       
       This pulls the IP, scans ports, and opens Metasploit.
       Add -a to the end to skip manual selections.

    2. Post-Exploitation:
       Use 'explorer' to open shell. Once in wipe logs, find the cookie 
       file. Copy the JWT and 'exit' the terminal.

    3. Extract Password:
       efx <paste_jwt_here>
       
       Downloads the decoder if needed and pulls the password.

--- COMMANDS ---
    filename -h                       Help/Usage
    filename -e <email>        Email Recon Mode
    filename -e <email> -a    Auto-Exploit Mode
    filename <jwt>                 JWT Decoder Mode