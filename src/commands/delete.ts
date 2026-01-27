/**
 * dft delete <project_name>
 * Delete an existing project
 */

import { deleteProject, projectExists } from "../data/storage";
import { ExitCodes } from "../data/types";
import { normalizeProjectName } from "../utils/validation";

/**
 * Prompts for confirmation via stdin
 *
 * @param message - The prompt message
 * @returns true if user confirms, false otherwise
 */
async function promptConfirmation(message: string): Promise<boolean> {
	process.stdout.write(`${message} (y/N): `);

	return new Promise((resolve) => {
		// Use Bun's readline capabilities
		const stdin = process.stdin;
		stdin.setRawMode?.(false);

		const onData = (data: Buffer) => {
			const input = data.toString().trim().toLowerCase();
			stdin.removeListener("data", onData);
			resolve(input === "y" || input === "yes");
		};

		stdin.once("data", onData);
		stdin.resume();
	});
}

/**
 * Deletes a project
 *
 * @param projectName - The name of the project to delete
 * @param options - Command options
 */
export async function deleteCommand(
	projectName: string,
	options: { yes?: boolean },
): Promise<void> {
	const normalizedName = normalizeProjectName(projectName);

	// Check if project exists
	if (!(await projectExists(normalizedName))) {
		console.error(
			`Project '${normalizedName}' not found. Use 'dft list' to see available projects.`,
		);
		process.exit(ExitCodes.NOT_FOUND);
	}

	// Confirm deletion unless --yes is used
	if (!options.yes) {
		const confirmed = await promptConfirmation(
			`Are you sure you want to delete project '${normalizedName}'?`,
		);
		if (!confirmed) {
			console.log("Cancelled.");
			process.exit(ExitCodes.CANCELLED);
		}
	}

	try {
		await deleteProject(normalizedName);
		console.log(`Deleted project '${normalizedName}'`);
		process.exit(ExitCodes.SUCCESS);
	} catch (error) {
		console.error(error instanceof Error ? error.message : "Failed to delete project");
		process.exit(ExitCodes.FILESYSTEM_ERROR);
	}
}
