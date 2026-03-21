# Scripting

## How do I create my own program?

You can automate hacking or other things by creating your own custom programs.

You can do this with the Code++ application.

Hackhub supports **TypeScript** language for scripting.

You can use the default TypeScript syntax. Additionally, Hackhub has functions and libraries defined for managing the game.

## Code++ Editor Features

*   **Tabbed editing** — Open and work on multiple files at once. Drag tabs to reorder them.
*   **Themes** — Choose from 20 color themes (Dracula, Tokyo Night, Catppuccin, etc.) in Settings.
*   **Fonts** — Pick your preferred font family and size in Settings.
*   **IntelliSense** — Full autocomplete and type checking for all built-in APIs.
*   **Import support** — Split code across files with

```
import
```
/
```
export
```

(see "Modules & Imports").

## I wrote the code, But how do I run it?

After writing a program, you need the "node.js" package to run it.

```bash
apt-get install node
```

To run a saved TypeScript file:

```bash
node /path/to/yourprogram.ts
```
You can also press the "Play" button in the Code++ editor to run the active file directly.

## Converting code to command

After writing a program, we run it with the "node" command. So how do we turn this program into a terminal command?

If you put the code file you created into the "lib" folder, that file will now run as a special command.

Example:

```bash
/lib/myprogram.ts
```
In terminal:

```bash
myprogram
```

Another example:

```bash
/lib/custom-tool.ts
```
```bash
custom-tool
```

## Modules & Imports

You can split your code across multiple files and import/export between them using standard TypeScript syntax.

### Exporting

Use
```
export
```
to make functions, classes, or variables available to other scripts.

```typescript
// utils.ts
export function greet(name: string) {
  println("Hello, " + name + "!");
}

export const VERSION = "1.0";

export async function dowork() {
  println("Working...");
  await sleep(1000);
  println("Done.");
}
```

### Importing

Use
```
import
```
to bring in exports from another file. Paths are relative to the current file.

```typescript
// main.ts
import { greet, VERSION, dowork } from "./utils";

greet("World");
println("Version: " + VERSION);
await dowork();
```

### How It Works

* Files are resolved relative to the importing file's directory (sibling files).
* The `.ts` extension is optional — `"./utils"` and `"./utils.ts"` both work.
* All built-in functions (`println`, `sleep`, `exit`, `readTextFile`, `writeTextFile`, `readDir`, `mkdir`, `removeFile`, `renameFile`, `isFile`, `isDir`, `isSymlink`, `exec`, `serve`, `prompt`, `Shell`, `Networking`, etc.) work inside imported modules.
* Imports are resolved recursively — imported files can import other files.

## Multi-File Project Example

```typescript
// scanner.ts
export async function scanTarget(ip: string) {
  const subnet = await Networking.GetSubnet(ip);
  if (!subnet) throw "No subnet found!";
  const ports = await subnet.GetPorts();
  return ports;
}
```

```typescript
// main.ts
import { scanTarget } from "./scanner";

const ip = await prompt("Target IP: ");
const ports = await scanTarget(ip);
println("Open ports: " + ports.join(", "));
```

### Type Support

The Code++ editor provides full IntelliSense for imports. When you type
```typescript
import { } from "./file"
```
, the editor will autocomplete exported symbols from that file.

# Lib - System

Basic I/O functions for your scripts.

### Printing Output

```typescript
println("Hello World!");
println(42);
```

## Colored Output

```typescript
println({ text: "Success!", color: "green" });
println({ text: "Error!", color: "red", backgroundColor: "#333" });
```

## Inline Colored Text

```typescript
println([
  { text: "Status: ", color: "white" },
  { text: "OK", color: "green" }
]);
```

## Print Table

Display data in a formatted ASCII table.

```typescript
printTable([
  { Name: "SSH", Port: 22, Status: "open" },
  { Name: "HTTP", Port: 80, Status: "closed" }
]);
```

## New Line

```typescript
newLine();
```

## User Input

```typescript
const ip = await prompt("IP Address: ");
println(`You entered: ${ip}`);
```

## Password Input (hidden)

```typescript
const pass = await prompt({ label: "Password: ", password: true });
```

# Lib - Shell

Manage the terminal from your scripts.

## Terminal Lock

Lock terminal input during long operations.

```typescript
Shell.lock();    // Locks input
Shell.unlock();  // Unlocks input
Shell.isLocked(); // -> boolean
```

## Clear Terminal

```typescript
Shell.clear();
```

## Arguments

Get command-line arguments passed to your script.

Example:

```
myprogram -ip 192.168.1.1 -port 21
```

```typescript
const args = Shell.GetArgs();
// -> ["-ip", "192.168.1.1", "-port", "21"]
```

## Execute Commands

Run terminal commands from your script.

```typescript
await Shell.Process.exec("nmap 192.168.1.1 -sV");
```

With working directory options:

```typescript
// Run in a specific subdirectory
await Shell.Process.exec("cat passwords.txt", {
  cwd: "documents"
});

// Run with absolute path
await Shell.Process.exec("ls", {
  cwd: "/home/user/desktop",
  absolute: true
});
```

# Lib - Packages

To check if a package is installed

```typescript
checkLib(packageName: string) -> boolean
```

Example

```typescript
checkLib("lynx")
```

Returns true if package installed, and false for not installed.

## Installing Package

```typescript
installLib(packageName: string) -> Promise<boolean>
```

Example

```typescript
const isInstalled = await installLib("lynx");
println(isInstalled); // Returns true or false.
```

# Lib - Debug

You can use the game's developer console to log your output. Use the "F1" key to do this.

```typescript
Debug.Log("Hello World!");
```

```typescript
Debug.Error("This is error!");
```

# Lib - Thread

Used for thread operations.

## To wait

```typescript
sleep(timeout: number (ms)) -> Promise<void>
```

```typescript
println("Loading...");
await sleep(2500); // Waits 2.5 seconds
println("Done.");
```

# Lib - File System

Manage files and directories on the computer.

Most methods accept an optional
```
options
```
parameter:

- `absolute`

  — resolve path from root instead of current directory

- `recursive`

  — create intermediate directories automatically (Mkdir, WriteFile)

## Current Working Directory

```typescript
const info = await FileSystem.cwd();
println(info.name);         // "desktop"
println(info.currentPath);  // "desktop"
println(info.absolutePath); // "/home/user/desktop"
```

## Navigate Directories

```typescript
await FileSystem.SetPath("documents");
await FileSystem.SetPath("/home/user", { absolute: true });
```

## List Files

```typescript
const files = await FileSystem.ReadDir(".");
if (!files) throw "Cannot access directory!";
for (const file of files) {
  println(`${file.name} - ${file.isFolder ? "folder" : file.extension}`);
}
```

## Read File

```typescript
const content = await FileSystem.ReadFile("notes.txt");
println(content);
```

## Write File

Creates a new file or overwrites an existing one.

```typescript
await FileSystem.WriteFile("output.txt", "Hello World!");
```

```typescript
// Auto-create parent directories
await FileSystem.WriteFile("deep/path/file.txt", data, {
  recursive: true
});
```

## Create Directory

```typescript
await FileSystem.Mkdir("my-folder");
await FileSystem.Mkdir("path/to/folder", { recursive: true });
```

## Delete File or Folder

```typescript
await FileSystem.Remove("old-file.txt");
```

# Lib - Networking

Network operations and subnet analysis.

## Validate IP Address

```typescript
Networking.IsIp("192.168.1.1"); // true
Networking.IsIp("abc");         // false
```

## Get Subnet

```typescript
const subnet = await Networking.GetSubnet("11.22.33.44");
if (!subnet) throw "Subnet not found!";
println(subnet.ip);    // "11.22.33.44"
println(subnet.lanIp); // "192.168.1.2"
```

## Subnet Methods

```typescript
const subnet = await Networking.GetSubnet(ip);

// Get the router of this subnet
const router = await subnet.GetRouter();

// List open port numbers
const ports = await subnet.GetPorts(); // -> number[]

// Check if a specific port is open
const isOpen = await subnet.PingPort(22); // -> boolean

// Get detailed port information
const portData = await subnet.GetPortData(22);
if (portData) {
  println(portData.service);   // "ssh"
  println(portData.version);   // "OpenSSH 8.2"
  println(portData.external);  // 22
  println(portData.internal);  // 22
  println(portData.target);    // "192.168.1.2"
}
```

# Lib - Networking.Wifi

Wireless network scanning and attack tools (similar to Bettercap).

## List Interfaces

```typescript
const interfaces = await Networking.Wifi.GetInterfaces();
for (const iface of interfaces) {
  println(`${iface.name} - monitor: ${iface.monitor}`);
}
// wlan0 - monitor: true
// wlan1 - monitor: false
```

## Scan Networks

Requires a monitor-mode capable interface (e.g.
```
wlan0
```

```typescript
const networks = await Networking.Wifi.Scan("wlan0");
for (const ap of networks) {
  println(`${ap.ssid} | ${ap.bssid} | Ch:${ap.channel} | Signal:${ap.signal}`);
}
```

## Deauthentication Attack

Send deauth frames to disconnect clients from an access point.

```typescript
await Networking.Wifi.Deauth("wlan0", targetBssid);

// With custom packet count
await Networking.Wifi.Deauth("wlan0", targetBssid, { packets: 10 });
```

## Capture WPA Handshake

Captures the WPA handshake and saves it as a
```
.pcap
```
file in the current directory.

```typescript
const pcapFile = await Networking.Wifi.CaptureHandshake("wlan0", bssid);
println(`Saved: ${pcapFile}`); // "networkname.pcap"
```

## Full Example - Wi-Fi Cracker

```typescript
const ifaces = await Networking.Wifi.GetInterfaces();
const mon = ifaces.find(i => i.monitor);

const networks = await Networking.Wifi.Scan(mon.name);
const target = networks[0];

await Networking.Wifi.Deauth(mon.name, target.bssid);
const pcap = await Networking.Wifi.CaptureHandshake(mon.name, target.bssid);

const password = await Crypto.Hashcat.Decrypt(pcap);
println(`Password: ${password}`);
```

# Lib - Crypto

Cryptographic utilities and password cracking.

## Hashcat — Crack Wi-FI Passwords

Decrypt captured
```
.pcap
```
files to reveal Wi-Fi passwords.

```typescript
const password = await Crypto.Hashcat.Decrypt("capture.pcap");
println(`Cracked: ${password}`);
```

### With path options:

```typescript
// Resolve from a specific directory
await Crypto.Hashcat.Decrypt("capture.pcap", { cwd: "downloads" });

// Resolve from root
await Crypto.Hashcat.Decrypt("capture.pcap", { absolute: true });
```

## Hash Utilities

```typescript
// Generate MD5 hash
const hash = Crypto.Hash.md5("hello world");

// Encrypt a password (stores mapping for later decryption)
const encrypted = Crypto.Hash.encrypt("mypassword");

// Decrypt a previously encrypted hash
const original = Crypto.Hash.decrypt(encrypted);
println(original); // "mypassword"
```

# Lib - HackDB

Access the exploit database programmatically.

## List All Exploits

```typescript
const exploits = await HackDB.ListExploits();
for (const exploit of exploits) {
  println(`${exploit.title} - ${exploit.service} ${exploit.version}`);
}
```

## Search Exploits

```typescript
const results = await HackDB.SearchExploits("ftp");
printTable(results.map(e => ({
  Title: e.title,
  Service: e.service,
  Version: e.version
})));
```

## Download Exploit

```typescript
// Download to ~/downloads (default)
await HackDB.DownloadExploit("sqlmap");

// Download to a specific directory
await HackDB.DownloadExploit("wordlist", "tools");

// Download with absolute path
await HackDB.DownloadExploit("kimai", "/home/user/desktop", {
  absolute: true
});
```

# Lib - NTLM

NTLM authentication attack library.

## Check NTLM Service

Check if a target has NTLM authentication enabled.

```typescript
const hasNtlm = await NTLM.Check("11.22.33.44");
if (!hasNtlm) throw "No NTLM service found.";
```

## Connect & Dump Hashes

```typescript
const connection = await NTLM.Connect("11.22.33.44");
const instance = await connection.GetInstance("2"); // NTLM version
await instance.Dump("admin"); // Dumps the user's NTLM hash
```

## Full Example

```typescript
const ip = "11.22.33.44";

if (await NTLM.Check(ip)) {
  println("NTLM service found, connecting...");
  const conn = await NTLM.Connect(ip);
  const ntlm = await conn.GetInstance("2");
  await ntlm.Dump("admin");
  println("NTLM hash dumped successfully.");
}
```
