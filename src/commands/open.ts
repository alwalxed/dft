/**
 * dft open <project_name> or dft <project_name>
 * Launch the interactive TUI session
 */

import { loadProject } from "../data/storage";
import type { Project } from "../data/types";
import { ExitCodes } from "../data/types";
import { startTUI } from "../tui/app";
import { normalizeProjectName } from "../utils/validation";

/**
 * Opens a project in the interactive TUI
 *
 * @param projectName - The name of the project to open
 */
export async function openCommand(projectName: string): Promise<void> {
	const normalizedName = normalizeProjectName(projectName);

	let project: Project;
	try {
		project = await loadProject(normalizedName);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Failed to load project";

		if (message.includes("not found")) {
			console.error(message);
			process.exit(ExitCodes.NOT_FOUND);
		} else {
			console.error(message);
			process.exit(ExitCodes.CORRUPTED);
		}
	}

	try {
		await startTUI(project);
		process.exit(ExitCodes.SUCCESS);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "TUI error occurred");
		process.exit(ExitCodes.TUI_ERROR);
	}
}
