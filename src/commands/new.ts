import { v4 as uuidv4 } from "uuid";
import { projectExists, saveProject } from "../data/storage";
import type { Project } from "../data/types";
import { ExitCodes } from "../data/types";
import { validateProjectName } from "../utils/validation";

export async function newCommand(projectName: string): Promise<void> {
	const nameValidation = validateProjectName(projectName);
	if (!nameValidation.isValid) {
		console.error(nameValidation.error);
		process.exit(ExitCodes.INVALID_NAME);
	}

	const normalizedName = projectName.toLowerCase();

	if (await projectExists(normalizedName)) {
		console.error(
			`Project '${normalizedName}' already exists. Use 'dft open ${normalizedName}' to work on it.`,
		);
		process.exit(ExitCodes.ALREADY_EXISTS);
	}

	const now = new Date().toISOString();
	const project: Project = {
		project_name: normalizedName,
		version: "1.0.0",
		created_at: now,
		modified_at: now,
		root: {
			id: uuidv4(),
			title: "root",
			status: "open",
			children: [],
			created_at: now,
			completed_at: null,
		},
	};

	try {
		await saveProject(project);
		console.log(`Created project '${normalizedName}'`);
		process.exit(ExitCodes.SUCCESS);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Failed to create project");
		process.exit(ExitCodes.FILESYSTEM_ERROR);
	}
}
