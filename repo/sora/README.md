<pre class="text-rose-500 text-center text-[9px]">
⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⢴⣲⣶⣶⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢠⢣⣾⠛⠉⠉⠉⠙⢻⣿⡆⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢠⢃⡾⠋⠀⠀⠀⠀⠀⠀⢻⣿⡄⠀⠀⠀⠀⠀
⠀⠀⠀⣠⣴⣶⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⢸⡿⡇⠀⠀⠀⠀⠀
⠀⣠⠾⠉⠁⢠⢳⡏⠎⠁⠁⠀⠀⠀⠀⠀⣼⣿⣧⣄⡀⠀⠀⠀
⠀⠀⠀⠀⣀⣈⠉⠓⢦⡀⠀⠀⠀⠀⠀⢠⡟⣿⠉⠙⠻⣷⡀⠀
⡆⠀⢰⣿⣿⣿⣿⣦⠀⣹⡄⠀⠀⠀⠀⠀⠈⠉⠉⠒⢤⡀⠻⡆
⢳⣄⠘⠿⣿⣿⡿⠏⣠⣿⠁⠀⡄⠀⢀⣶⣿⣿⣷⣄⠂⡽⡄⠀
⠀⠈⠻⠶⢖⣲⣺⠼⠛⠁⠀⠀⠹⣄⠈⠻⣿⣿⣿⠟⢀⣼⠇⠀
⠀⠀⠀⠀⠀⣿⣿⠀⠀⠀⠀⠀⠀⠈⠻⣷⣖⣖⣲⣼⠿⠋⠀⠀
⠀⠀⠀⠀⠀⣿⣿⠀⣤⡄⠀⠀⠀⠀⠀⣿⣿⡎⠀⠀⣠⡄⠀⠀
⠀⠀⠀⠀⠀⣿⣿⢀⣿⡇⠀⠀⠀⠀⠀⣿⣿⠁⠀⣸⣿⠇⠀⠀
⠀⠀⠀⠀⠀⣿⣿⠀⣿⡇⠀⠀⠀⠀⠀⣿⣿⠀⢠⣿⡟⠀⠀⠀
⠀⠀⠀⠀⠀⣿⣿⠀⣿⡇⠀⠀⠀⠀⠀⣿⣿⠀⢸⣿⡇⠀⠀⠀
⠀⠀⠀⠀⠀⢻⡯⡇⣿⣳⠀⠀⠀⠀⠀⣿⣿⠀⢹⣾⠇⠀⠀⠀
⠀⠀⠀⠀⠀⢸⡗⡇⢻⣾⡀⠀⠀⠀⠀⣿⣿⠀⢸⣯⡇⠀⠀⠀
⠀⠀⠀⠀⠀⢸⣿⢣⠘⣷⣣⠀⠀⠀⢀⣏⡿⠀⢸⡷⣇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⣿⡺⠀⠙⣷⣽⣒⣒⣮⡾⠃⠀⠰⣿⣯⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢹⣧⠇⠀⠀⠈⠉⠉⠁⠀⠀⠀⠰⣿⣿⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠈⣿⡼⡀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡗⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠘⣧⡵⡀⠀⠀⠀⠀⠀⠀⢀⣎⣿⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⣟⢄⡀⠀⠀⢀⡠⢜⣸⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢷⣯⣭⣭⡵⠾⠛⠁⠀⠀⠀⠀⠀
</pre>

Sora is a professional terminal-output library for building clean, consistent CLI experiences.

How to use:
- If you want to use Sora, keep the library in /lib.
- Import Sora and call Sora.ctx() to get the output context.
- Use the context methods below to format terminal output in a consistent style.

Output:
- print(text, color?) - print a line.
- printLn({ text, color?, backgroundColor? }) - styled line.
- newLine() - blank line.

Layout:
- section(title, subtitle?) - section header + divider.
- divider(char?, width?) - divider line.
- printBlockTitle(title) - block header.
- printBlockFooter() - block footer.
- block(title, lines[]) - quick block.
- badge(text, color?, backgroundColor?) - label chip.
- align(text, width, mode) - left/center/right pad.
- setBlockWidth(width) - set block width.
- setTableWidth(width) - set table width.

Lists:
- list(items, { bullet?, color? }) - bulleted list.
- listNumbers(items, { color? }) - numbered list.

Tables:
- printTable(rows, options) - table from objects.
- tableFromPairs(pairs, options) - key/value table.
- tableFromArray(headers, rows, options) - table from arrays.
- printColumns(left, right, options) - two-column line.

Prompts:
- promptText(label) - text input.
- promptPassword(label) - hidden input.
- promptTextValidated(label, options) - text with validation.
- promptNumber(label, options) - number with validation.
- promptChoice(label, options, opts) - pick from list.

Status helpers:
- info(text) - info line.
- success(text) - success line.
- warn(text) - warning line.
- error(text) - error line.
- fatal(text) - error + throw.

Palette:
- colors - named colors for consistent output.

For full examples, see sora-example.ts.