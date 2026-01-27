/**
 * dft list
 * List all projects sorted by creation date (newest first)
 */

import { listProjects } from "../data/storage";

/**
 * Lists all projects
 */
export async function listCommand(): Promise<void> {
	const projects = await listProjects();

	if (projects.length === 0) {
		console.log("No projects found. Create one with 'dft new <name> <title>'");
		process.exit(0);
	}

	console.log("Projects:");
	for (const project of projects) {
		const problemWord = project.nodeCount === 1 ? "problem" : "problems";
		console.log(`  • ${project.name} (${project.nodeCount} ${problemWord})`);
	}

	process.exit(0);
}
