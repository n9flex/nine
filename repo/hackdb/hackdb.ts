/**
 * hackdb
 * @app-description HackDB CLI to fetch all exploits fast.
 */

const args = Shell.GetArgs();

await main();

async function main() {
  const sub = (args[0] || "").toLowerCase();
  const all = args.includes("-all");

  if (sub !== "download" || !all) {
    print("Usage: hackdb download -all");
    return;
  }

  await downloadAll();
}

async function downloadAll() {
  try {
    const exploits = await HackDB.ListExploits();
    if (!exploits.length) {
      error("No exploits available");
      return;
    }

    for (const exploit of exploits) {
      if (!exploit.title) continue;
      print(`Downloading: ${exploit.title}`);
      await HackDB.DownloadExploit(exploit.title);
    }
  } catch (err) {
    error(`Download failed: ${err}`);
  }
}

function print(text) {
  println({ text, color: "gray" });
}

function error(text) {
  println({ text, color: "red" });
}
