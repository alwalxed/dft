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
		console.log("No projects found. Create one with 'dft new <name>'");
		process.exit(0);
	}

	console.log("Projects:");
	for (const project of projects) {
		// Subtract 1 to exclude the root node from the count
		const taskCount = project.nodeCount - 1;
		const taskWord = taskCount === 1 ? "task" : "tasks";
		console.log(`  • ${project.name} (${taskCount} ${taskWord})`);
	}

	process.exit(0);
}
