import { loadProject, saveProject } from "../data/storage";
import type { Project } from "../data/types";
import { ExitCodes } from "../data/types";
import { startTUI } from "../tui/app";

export async function openCommand(projectName: string): Promise<void> {
	const normalizedName = projectName.toLowerCase();

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

	project.open_count = (project.open_count ?? 0) + 1;
	try {
		await saveProject(project);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Failed to update open count");
	}

	try {
		await startTUI(project);
		process.exit(ExitCodes.SUCCESS);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "TUI error occurred");
		process.exit(ExitCodes.TUI_ERROR);
	}
}
