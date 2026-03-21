<pre class="text-rose-500 text-center text-[9px]">
 ██████╗ ██████╗ ██╗      ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██║     ██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║     ██║   ██║██████╔╝███████╗
██║     ██║   ██║██║     ██║   ██║██╔══██╗╚════██║
╚██████╗╚██████╔╝███████╗╚██████╔╝██║  ██║███████║
 ╚═════╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝
</pre>

-- Overview --
Color palette viewer. Displays all available named colors, hex codes, and background colors to help you pick the perfect colors for your tools.

-- Usage --
node colors.ts

-- Features --
- Named colors (12 built-in: black, white, red, green, etc.)
- Hex colors (80+ examples: brand colors, neon, pastel, cyberpunk)
- Modern palette (Tailwind-inspired colors)
- Grays & dark theme (Slate, Zinc, Neutral scales)
- Brand colors (Discord, GitHub, Spotify, etc.)
- Cyberpunk / retro (Matrix, Terminal, Synthwave)
- UI/Feedback colors (Success, Warning, Error variants)
- Background color demos
- Rainbow gradient demonstration

-- Examples --
// Print with named color
println({ text: "Hello", color: "green" });

// Print with hex color
println({ text: "Custom", color: "#ff2056" });

// Background color
println({ text: "Alert", color: "white", backgroundColor: "#aa0000" });

// Multi-color line
println([
  { text: "[+] ", color: "green" },
  { text: "Success", color: "white" }
]);

-- Requirements --
- apt-get install node

_________        .__                       
\_   ___ \  ____ |  |   ___________  ______
/    \  \/ /  _ \|  |  /  _ \_  __ \/  ___/
\     \___(  <_> )  |_(  <_> )  | \/\___ \ 
 \______  /\____/|____/\____/|__|  /____  >
        \/                              \/ 