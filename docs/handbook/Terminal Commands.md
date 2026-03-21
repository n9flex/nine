**Command: apt-get install**
Installs terminal command package.

Usage

```
apt-get install [package name]
```

**Command: bettercap**
Bettercap is a powerful, modular, and easily extensible framework designed for network attacks and monitoring.

Installation

```
apt-get install bettercap
```

Start

```
bettercap
```

Start Probing

```
net.probe on
```

Show network card list

```
net.show
```

Set wi-fi recon to interface which monitoring mode is enabled

```
wifi.recon [interface]
```

Then show wi-fi list

```
wifi.show
```

Set target wi-fi

```
set wifi.ap [BSSID]
```

Send deauthuntication packets to target

```
wifi.deauth
```

Exit bettercap

```
exit
```

Install hashcat for decrypt hash

```
apt-get install hashcat
```

Crack password

```
hashcat [pcap file]
```

**Command: cat**
Reads file content.

Usage

```
cat [file name]
```

**Command: cd**
The cd command used to change the current working directory.

Usage

```
cd [directory name]
```

To go back or upper directory:

```
cd ..
```

**Command: dig**
Dig is a command-line tool for gathering information about IP address.

```
dig <ip address>
```

**Command: dirhunter**
Dirhunter is a web directory discovery tool. It scans a target website and reveals its publicly accessible paths and pages.

Useful for reconnaissance — finding hidden admin panels, API endpoints, or forgotten pages on a target domain.

**Install:**

```
apt-get install dirhunter
```

**Usage:**

```
dirhunter <domain>
```

**Example:**

```
dirhunter example.com
```

The tool will scan the target and list all discovered directories and pages.

**Command: download**
Downloads a file from the remote server to your local machine.

Usage

```
download <file path>
```

**Command: ftp**
It allows us to connect and manage the remote ftp server.

Usage

```
ftp -h [host] -u [user] -p [password]
```

**Command: geoip**
Geoip is a well-known tool that helps you find the location of a given IP address.

```
geoip <ip address>
```

Example

```
geoip 46.20.15.34
```

**Command: git**
Git is the platform where players store and share the programs they write.

**Initialize Repository** For example we're on folder that have scripts.

```
git init -n <repo name>
```

**Commit** Add commit to repository.

```
git commit -m <message>
```

**Push** Push commit to repository.

```
git push
```

**Pull** Pull latest updates on repository.

```
git pull
```

**Clone** Clone repository.

```
git clone <repository slug> <path to clone>
```

Example

```
git clone example-hack-tool ./home/user/desktop/repo-folder
```

**Command: hydra**
Hydra is a parallelized login cracker that supports numerous protocols.

* The

```
-u
```

flag is optional. If omitted, Hydra automatically uses **root** as the default username.

* The

```
-T
```

flag specifies the target in the *IP:Port* format.
Example:

```
hydra -T 192.168.1.1:22 -P ./wordlist.lst
```

* The

```
-P
```

flag is used to provide the path to your wordlist file. Make sure to specify the correct absolute or relative path.
Example: if you're in the root directory and the file is inside **downloads**:

```
-P /downloads/wordlist.lst
```

Usage (default username: root):

```
hydra -T [ip:port] -P [wordlist]
```

Usage (with username):

```
hydra -T [ip:port] -l [username] -P [wordlist]
```

**Command: john**
john, meaning "John The Ripper", is used to crack the password of encrypted texts.

You must install the package first.

```
apt-get install john
```

john has 2 different uses.

* File password cracking

```
john /etc/passwd
```

* Deciphering the hash string

```
john <hash>
```

Example

```
john 31435008693ce6976f45dedc5532e2c1
```

**Command: ls**
The ls command is used to list files. "ls" on its own lists all files in the current directory.

Usage

```
ls
```

**Command: lynx**
It performs a deep search on the Internet.

Usage

```
lynx [search]
```

**Command: mkdir**
The mkdir command is used to create a new directory.

Usage

```
mkdir <directory name>
```

Example

```
mkdir myfolder
```

**Command: mxlookup**
Finds mail server of domain.

```
mxlookup <domain>
```

Example

```
mxlookup example.com
```

**Command: nmap**
Nmap is an open source tool used for network scanning and vulnerability detection.

You can perform a more detailed scan using the -sV flag and learn about the services running in the background and their version information.

Default usage

```
nmap [ip address]
```

For detailed usage

```
nmap [ip address] -sV
```

For specific port

```
nmap [ip address] -port [port number]
```

**Example Usage**

Let's take the IP address 10.22.33.44 as an example.

Let's list the ports on this address.

```
nmap 10.22.33.44
```

The output we will get:

| PORT | STATE | SERVICE |
|------|-------|---------|
| 21   | OPEN  | ftp     |
| 22   | CLOSE | ssh     |
| 80   | CLOSE | http    |

STATE:

- **OPEN:** This port is defined and actively used.
- **CLOSE:** These ports are defined but closed for use.
- **FORWARDED:** The port is open, but it has been redirected to a different port instead of the default one. This means the service is still accessible, but through a different port number. For example, an FTP server normally runs on port 21, but if it appears as FORWARDED on port 37359, it means connections to 37359 are being forwarded to the actual FTP service running on port 21 inside the network.

SERVICE:

- Service running on this port in the background.

When we use a more detailed search:

```
nmap 10.22.33.44 -sV
```

The output we will get:

| PORT | STATE | SERVICE | VERSION       | DESTINATION  |
|------|-------|---------|---------------|--------------|
| 21   | OPEN  | ftp     | vsftpd 1.0.0  | 192.168.1.2  |
| 22   | CLOSE | ssh     | openssh 1.0.0 | 192.168.1.2  |
| 80   | CLOSE | http    | nginx 1.0.0   | 192.168.1.2  |

**VERSION:**

This section consists of 2 parts.

- **Part 1:** Name of the running application.
- **Part 2:** Version of this running application.

If we know the running service version and the port is open, we can infiltrate this system.

**Command: node**
This command allows you to run in-game scripts (with a .ts extension). It is not installed by default.

```
node myscript.ts
```

**Command: nslookup**
Finds the IP address of the target domain.

Usage

```
nslookup [domain]
```

**Command: Nuclei**
**Nuclei** is a fast, customizable vulnerability scanner.

```
nuclei -h <hosts>
```

Usage

To use Nuclei, you need a text document containing domain addresses.

Example: /domain_list.txt

```
example.com
domain.com
myanotherdomain.com
```

Then

```
nuclei -h /domain_list.txt
```

**Command: openssl**
Encrypts or decrypts text.

Usage for encryption

```
openssl -enc [text]
```

Usage for decryption

```
openssl -dec [text]
```

**Command: ping**
It checks whether it successfully sent a packet to the server and whether it received a response.

Usage

```
ping [ip address]
```

**Command: pip**
Pip is a package manager for Python. It is required for installing programs written in Python.

For install

```
apt-get install pip
```

Installing python package

```
pip install <package name>
```

Example

```
pip install sqlmap
```

**Command: python3**
The **python3** command allows us to run a python script.

Usage

```
python3 [/destination/to/file]
```

Example

```
python3 /downloads/net_tree.py
```

You can find python scripts to run on **hackdb.net**

**Command: rm**
Deletes file/folder.

Usage

```
rm [file/folder name]
```

**Command: ssh**

- Secure Shell (SSH) is a protocol that provides a secure way to access a remote computer.
- It allows you to remotely log in to a system and execute commands as if you were sitting at the console.
- The important thing is flags.
- In ssh we don't use common usage.
- At -h flag you need to combine username and ip address (without port).
- Example: root@192.168.1.1

Usage

```
ssh -h [username@ip] -p [password]
```

**Command: subfinder**
**subfinder** is a subdomain discovery tool that returns valid subdomains for websites, using passive online sources. It has a simple, modular architecture and is optimized for speed. subfinder is built for doing one thing only - passive subdomain enumeration, and it does that very well.

```
subfinder -d <domain>
```

Examples

```
subfinder -d example.com
```

```
subfinder -d https://example.com
```

**Command: sudo**
It allows you to switch to the "root" user, which is the highest authorized user in computer.

If you want, switch directly to the root user or run a command with root authority.

Switch root user

```
sudo -su
```

Run command with root privileges

```
sudo [command]
```

Example:

```
sudo apt-get install metasploit
```

**Command: weeChat**
WeeChat allows you to chat online completely anonymously using just your username. It's often used for darknet.

Usage

```
weechat <ip address> <password>
```

**Command: whois**
With the Whois command, you can find the person who owns a domain, IP address or email address.

Usage

```
whois [domain/ip address/email]
```
