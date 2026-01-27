/**
 * Platform-specific utilities for cross-platform paths
 */

import { homedir, platform } from "node:os";
import { join } from "node:path";

/**
 * Gets the platform-specific data directory
 * - macOS: ~/Library/Application Support/
 * - Linux: $XDG_DATA_HOME or ~/.local/share/
 * - Windows: %APPDATA%
 *
 * @returns The data directory path
 */
export function getDataDir(): string {
	switch (platform()) {
		case "darwin":
			return join(homedir(), "Library", "Application Support");
		case "win32":
			return process.env.APPDATA || join(homedir(), "AppData", "Roaming");
		default:
			// Linux and others
			return process.env.XDG_DATA_HOME || join(homedir(), ".local", "share");
	}
}

/**
 * Gets the depthfirst projects directory
 *
 * @returns The projects directory path
 */
export function getProjectsDir(): string {
	return join(getDataDir(), "depthfirst", "projects");
}

/**
 * Gets the full path to a project file
 *
 * @param name - The project name (will be converted to lowercase)
 * @returns The full path to the project JSON file
 */
export function getProjectPath(name: string): string {
	return join(getProjectsDir(), `${name.toLowerCase()}.json`);
}
