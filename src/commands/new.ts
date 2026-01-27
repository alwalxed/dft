/**
 * dft new <project_name>
 * Create a new project with a default root node
 */

import { v4 as uuidv4 } from "uuid";
import { projectExists, saveProject } from "../data/storage";
import type { Project } from "../data/types";
import { ExitCodes } from "../data/types";
import { normalizeProjectName, validateProjectName } from "../utils/validation";

/**
 * Creates a new project
 *
 * @param projectName - The name of the project
 */
export async function newCommand(projectName: string): Promise<void> {
	// Validate project name
	const nameValidation = validateProjectName(projectName);
	if (!nameValidation.isValid) {
		console.error(nameValidation.error);
		process.exit(ExitCodes.INVALID_NAME);
	}

	// Normalize project name to lowercase
	const normalizedName = normalizeProjectName(projectName);

	// Check if project already exists
	if (await projectExists(normalizedName)) {
		console.error(
			`Project '${normalizedName}' already exists. Use 'dft open ${normalizedName}' to work on it.`,
		);
		process.exit(ExitCodes.ALREADY_EXISTS);
	}

	// Create the project with default root
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
