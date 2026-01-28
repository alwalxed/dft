const packageJsonPath = new URL("../package.json", import.meta.url);
const versionFilePath = new URL("../src/version.ts", import.meta.url);

type PackageJson = {
	version?: string;
};

async function main() {
	const pkgFile = Bun.file(packageJsonPath);
	const pkg = (await pkgFile.json()) as PackageJson;

	if (!pkg.version) {
		console.error("package.json does not contain a version field.");
		process.exit(1);
	}

	const newContents = `export const VERSION = "${pkg.version}";\n`;

	await Bun.write(versionFilePath, newContents);
	console.log(`Synced src/version.ts to version ${pkg.version}`);
}

main().catch((error) => {
	console.error("Failed to sync version:", error);
	process.exit(1);
});

