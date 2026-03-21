# HackHub TypeScript API Reference

Quick reference for the HackHub game's TypeScript scripting environment. **Not standard TypeScript** — these are game-provided globals.

## Core I/O

```typescript
// Basic output
println("text")
println({ text: "colored", color: "green" | "red" | "yellow" | "cyan" | "#hex" })
println([{ text: "multi", color: "white" }, { text: "color", color: "green" }])

// Tables
printTable([
  { Port: 22, Service: "ssh", Status: "open" },
  { Port: 80, Service: "http", Status: "closed" }
])

// Input
const answer = await prompt("Question: ")
const password = await prompt({ label: "Password: ", password: true })

// Utils
await sleep(ms: number)
newLine()
```

## Shell

```typescript
const args = Shell.GetArgs() // string[]
Shell.lock() / Shell.unlock() / Shell.isLocked()
Shell.clear()

// Execute terminal commands
await Shell.Process.exec("nmap 1.2.3.4 -sV")
await Shell.Process.exec("ls", { cwd: "subdir" })
await Shell.Process.exec("cmd", { cwd: "/absolute/path", absolute: true })
```

## File System

```typescript
const { currentPath, absolutePath } = await FileSystem.cwd()
await FileSystem.SetPath("subdir")
await FileSystem.SetPath("/home/user", { absolute: true })

const files = await FileSystem.ReadDir(".") // { name, isFolder, extension }[]
const content = await FileSystem.ReadFile("file.txt")
await FileSystem.WriteFile("out.txt", "data", { recursive: true })
await FileSystem.Mkdir("folder", { recursive: true })
await FileSystem.Remove("file.txt")
```

## Networking

```typescript
// Validation
Networking.IsIp("1.2.3.4") // boolean

// Subnet analysis
const subnet = await Networking.GetSubnet("1.2.3.4")
// subnet.ip, subnet.lanIp, subnet.GetRouter()
const ports = await subnet.GetPorts() // number[]
const isOpen = await subnet.PingPort(22)
const portData = await subnet.GetPortData(22)
// portData.service, portData.version, portData.external, portData.internal

// WiFi (requires monitor interface)
const ifaces = await Networking.Wifi.GetInterfaces() // { name, monitor }[]
const networks = await Networking.Wifi.Scan("wlan0")
// networks[].ssid, networks[].bssid, networks[].channel, networks[].signal
await Networking.Wifi.Deauth("wlan0", bssid, { packets: 10 })
const pcap = await Networking.Wifi.CaptureHandshake("wlan0", bssid) // filename
```

## Cryptography

```typescript
// Hashcat WiFi cracking
const password = await Crypto.Hashcat.Decrypt("capture.pcap")
await Crypto.Hashcat.Decrypt("file.pcap", { cwd: "subdir" })

// Hash utilities
Crypto.Hash.md5("text")
const encrypted = Crypto.Hash.encrypt("password")
const original = Crypto.Hash.decrypt(encrypted)
```

## HackDB

```typescript
const exploits = await HackDB.ListExploits()
// exploits[].title, exploits[].service, exploits[].version
const results = await HackDB.SearchExploits("ftp")
await HackDB.DownloadExploit("sqlmap", "subdir") // to ~/downloads by default
```

## NTLM

```typescript
const hasNtlm = await NTLM.Check("1.2.3.4")
const conn = await NTLM.Connect("1.2.3.4")
const instance = await conn.GetInstance("2") // version
await instance.Dump("username")
```

## Package Management

```typescript
checkLib("lynx") // boolean
await installLib("metasploit") // Promise<boolean>
```

## Debug

```typescript
Debug.Log("message")
Debug.Error("error")
```

## Common Patterns

**CLI entry point:**
```typescript
const args = Shell.GetArgs()
if (!args.length) { println("Usage: tool <ip>"); exit() }
const target = args[0]
```

**Auto-install dependencies:**
```typescript
if (!checkLib("nmap")) await installLib("nmap")
```

**WiFi pipeline:**
```typescript
const mon = (await Networking.Wifi.GetInterfaces()).find(i => i.monitor)
if (!mon) { println("No monitor interface"); return }
const nets = await Networking.Wifi.Scan(mon.name)
await Networking.Wifi.Deauth(mon.name, targetBssid)
const pcap = await Networking.Wifi.CaptureHandshake(mon.name, targetBssid)
const pass = await Crypto.Hashcat.Decrypt(pcap)
```

## Anti-Patterns (Don't)

- ❌ `console.log()` — use `println()`
- ❌ `fetch()` — doesn't exist
- ❌ `fs.readFile()` — use `FileSystem.ReadFile()`
- ❌ Standard npm modules — not available
- ❌ `process.argv` — use `Shell.GetArgs()`
