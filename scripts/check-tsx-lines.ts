const MAX_LINES = 500;
const IGNORED = /(^|\/)(node_modules|\.output|\.turbo|dist|bin|\.nitro)\/|\.gen\.tsx$/;

const glob = new Bun.Glob("**/*.tsx");
const offenders: { file: string; lines: number }[] = [];

for await (const file of glob.scan({ cwd: ".", dot: false })) {
	if (IGNORED.test(file)) continue;
	const text = await Bun.file(file).text();
	const lines = text.endsWith("\n") ? text.split("\n").length - 1 : text.split("\n").length;
	if (lines > MAX_LINES) offenders.push({ file, lines });
}

if (offenders.length > 0) {
	for (const { file, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
		console.error(`${file}: ${lines} lines (max ${MAX_LINES})`);
	}
	process.exit(1);
}
