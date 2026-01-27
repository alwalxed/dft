import { homedir, platform } from "node:os";
import { join } from "node:path";

export function getDataDir(): string {
	switch (platform()) {
		case "darwin":
			return join(homedir(), "Library", "Application Support");
		case "win32":
			return process.env.APPDATA || join(homedir(), "AppData", "Roaming");
		default:
			return process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
	}
}

export function getProjectsDir(): string {
	return join(getDataDir(), "depthfirst", "projects");
}

export function getProjectPath(name: string): string {
	return join(getProjectsDir(), `${name.toLowerCase()}.json`);
}
