import { ExitCodes } from "../data/types";
import { VERSION } from "../version";

async function fetchLatestVersion(): Promise<string | null> {
	try {
		const response = await fetch("https://registry.npmjs.org/depth-first-thinking/latest");
		if (!response.ok) {
			return null;
		}
		const data = (await response.json()) as { version: string };
		return data.version;
	} catch {
		return null;
	}
}

function compareVersions(current: string, latest: string): number {
	const currentParts = current.split(".").map(Number);
	const latestParts = latest.split(".").map(Number);

	for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
		const currentPart = currentParts[i] ?? 0;
		const latestPart = latestParts[i] ?? 0;

		if (latestPart > currentPart) return 1;
		if (latestPart < currentPart) return -1;
	}

	return 0;
}

export async function updateCommand(): Promise<void> {
	const currentVersion = VERSION;
	console.log(`Current version: ${currentVersion}`);

	const latestVersion = await fetchLatestVersion();

	if (!latestVersion) {
		console.error("Failed to check for updates. Please check your internet connection.");
		process.exit(ExitCodes.FILESYSTEM_ERROR);
		return;
	}

	const comparison = compareVersions(currentVersion, latestVersion);

	if (comparison === 0) {
		console.log(`You are using the latest version (${currentVersion})`);
		process.exit(ExitCodes.SUCCESS);
		return;
	}

	if (comparison < 0) {
		console.log(`Update available: ${latestVersion}`);
		console.log("Run: bun install -g depth-first-thinking@latest");
		console.log("Or: npm install -g depth-first-thinking@latest");
		process.exit(ExitCodes.SUCCESS);
		return;
	}

	console.log(
		`You are using a newer version (${currentVersion}) than the published version (${latestVersion})`,
	);
	process.exit(ExitCodes.SUCCESS);
}
