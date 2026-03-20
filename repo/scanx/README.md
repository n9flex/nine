<pre class="text-rose-500 text-center text-[9px]">
⠀⠀⠀⠀⠀⠀⠀⣀⣤⣶⣿⠷⠾⠛⠛⠛⠛⠷⠶⢶⣶⣤⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣀⣴⡾⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⣷⣄⡀⠀⠀⠀
⠀⠀⣠⣾⠟⠁⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣤⣀⣀⡀⠀⠀⠀⠀⠈⠛⢿⣦⡀⠀
⢠⣼⠟⠁⠀⠀⠀⠀⣠⣴⣶⣿⣏⣭⣻⣛⣿⣿⣿⣷⣦⣄⠀⠀⠀⠀⠀⠙⣧⡀
⣿⡇⠀⠀⠀⢀⣴⣾⣿⣿⣿⣿⣟⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀⠀⠀⠀⢈⣷
⣿⣿⣦⡀⣠⣾⣿⣿⣿⣿⡿⠛⠉⠀⠀⠀⠘⠀⠈⠻⢿⣿⣿⣿⣿⣆⣀⣠⣾⣿
⠉⠻⣿⣿⣿⣿⣽⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣿⣿⣿⣿⠟⠁
⠀⠀⠈⠙⠛⣿⣿⠀⠀⠀⠀⠀⢀⣀⣶⣦⣶⣦⣄⡀⠀⠀⠀⣹⣿⡟⠋⠁⠀⠀
⠀⠀⠀⠀⠀⠘⢿⣷⣄⣀⣴⣿⣿⣭⣭⣭⣿⣽⣿⣷⣀⣀⣾⡿⠛⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠐⠘⢿⣿⣿⣿⣿⠟⠛⠛⠻⣿⣿⣿⣿⠿⡋⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⡇⠀⠀⠀⠀⠀⣿⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣷⣄⠀⠀⣀⣾⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⠿⠿⠿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
</pre>


-- Overview --
Fast subnet port scanner with service detection. Scans all ports on a target IP, detects open, forwarded and closed ports, and displays results in a color-coded table.

-- Usage --
scanx <ip>

-- Examples --
scanx 192.168.1.1
scanx 10.0.0.5
scanx 131.194.166.38

-- Output --
OPEN      green   Port is open and directly reachable
FORWARDED yellow  Port is open but routed through firewall/NAT (external != internal)
CLOSED    red     Port is closed

-- Columns --
Status    OPEN / FORWARDED / CLOSED
Port      External port number
Target    Internal target IP
Internal  Internal port number
Service   Detected service (ssh, http, https...)
Version   Service version

-- Requirements --
- sora library (https://github.com/repository?r=sora)
