export async function initializeEntryPoint(args, dir) {
    println({ text: `Initialized.`, color: `#a6ff00` });
    println({ text: `   Directory: ${dir}`, color: `#a6ff00` });
    if (args && args.length > 0) println({ text: `   Parameters: ${args.join(` `)}`, color: `#a6ff00` });
}