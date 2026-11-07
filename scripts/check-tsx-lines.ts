const MAX_LINES = 500;
const IGNORED = /(^|\/)(node_modules|\.output|\.turbo|dist|bin|\.nitro)\/|\.gen\.tsx$/;

const root = new URL("..", import.meta.url).pathname;
const glob = new Bun.Glob("**/*.tsx");
const offenders: { file: string; lines: number }[] = [];
let scanned = 0;

for await (const file of glob.scan({ cwd: root, dot: false })) {
	if (IGNORED.test(file)) continue;
	scanned += 1;
	const text = await Bun.file(`${root}${file}`).text();
	const lines = text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length;
	if (lines > MAX_LINES) offenders.push({ file, lines });
}

if (scanned === 0) {
	console.error("check-tsx-lines scanned no files; is the repo root intact?");
	process.exit(1);
}

if (offenders.length > 0) {
	for (const { file, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
		console.error(`${file}: ${lines} lines (max ${MAX_LINES})`);
	}
	process.exit(1);
}
