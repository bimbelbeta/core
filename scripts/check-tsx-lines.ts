const MAX_LINES = 500;

const roots = ["apps/web/src"];
const glob = new Bun.Glob("**/*.tsx");

const offenders: { file: string; lines: number }[] = [];

for (const root of roots) {
	for await (const path of glob.scan(root)) {
		const file = `${root}/${path}`;
		const lines = (await Bun.file(file).text()).split("\n").length;
		if (lines > MAX_LINES) offenders.push({ file, lines });
	}
}

if (offenders.length > 0) {
	for (const { file, lines } of offenders.sort((a, b) => b.lines - a.lines)) {
		console.error(`${file}: ${lines} lines (max ${MAX_LINES})`);
	}
	process.exit(1);
}
