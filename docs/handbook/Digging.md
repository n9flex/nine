# How to Find User Password in Remote Connection?

When you access a system, you may need users' passwords. Passwords are stored in an encrypted form in the operating system.

These passwords are stored in this file:

```
/etc/passwd
```

If you want, you can decrypt this file completely or the hashes in it one by one.

To do this, a tool is required.

```
apt-get install john
```

then

```
john <hash>
```

---

## Identifying the Firewall

Before we begin the credential extraction procedure, we must determine the firewall's IP address.

Let's assume the target firewall IP is **44.55.66.77**.

---

## Required Tools

To perform this operation, you will need the following:

- **Wireshark** – Used for monitoring network packets
- **Kimai Attack Script** – Downloadable from *hackdb.net*
- **JWT Decoder** – Also available at *hackdb.net*

These three tools work together to capture and decode authentication tokens.

---

## Preparing Wireshark

Open **Wireshark** and configure it for maximum visibility.

In the **Source** and **Destination** filters, enter:

```
*
```

This allows Wireshark to capture all incoming and outgoing data without restriction.

After setting the filter, press **Start** to begin live packet capturing.

You should now see a constant flow of traffic in the packet list.

---

## Generating Traffic With Kimai

Next, we must generate activity toward the target firewall to force it to produce session-related data.

From your terminal, launch the Kimai script targeting the firewall:

```
python3 ./kimai.py [ip address]
```

Example:

```
python3 ./kimai.py 44.55.66.77
```

Each execution *may* or may not result in a captured cookie.

Because of this, you must run the Kimai script repeatedly until a usable token appears in Wireshark.

While Kimai is running, Wireshark should display a continuous stream of packets.

---

## Finding the Cookie in Wireshark

Monitor the **Info** column in Wireshark.

When a cookie or token appears, it will usually be displayed as a short encoded string or session reference.

Continue running Kimai and monitoring the packets until a cookie-like entry becomes visible.

Once it appears, the data has been successfully captured.

Click on the packet to view its detailed contents, then copy the token.

---

## Decoding the Token

Now that you have the captured token, use the JWT Decoder tool.

Run the decoder script as follows:

```
python3 ./jwt_decoder.py [token]
```

Example:

```
python3 ./jwt_decoder.py eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

The decoder will process the token and reveal its contents.

Among the decoded fields, you will find the firewall's login credentials.

---

## Conclusion

At this stage:

1. The firewall IP was identified
2. Wireshark was configured to capture all traffic
3. Kimai generated forced traffic to obtain a token
4. A cookie was found inside Wireshark capture
5. The token was decoded using the JWT Decoder
6. Firewall login credentials were extracted successfully
