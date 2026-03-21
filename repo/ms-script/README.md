Overview
This script acts as a bridge for HackHub's Metasploit API, allowing you to search for exploits, set target parameters, and execute modules directly from just one initial line. It also includes integrated Nmap service detection.

Usage
msf-script [options]

Options
-h, --help           Show the help message
-s, --search         The search string (e.g., OpenSSH)
-v, --version        The version string (e.g., 2.5.5)
-sV, --version-all   Run Nmap service version detection on the IP
-ip, --address       The target IP address
-p, --port           The target port number

Examples
msf-script -h
msf-script -ip 192.168.1.1 -sV
msf-script -ip 192.168.1.1 -p 22 -s OpenSSH -v 2.5.5