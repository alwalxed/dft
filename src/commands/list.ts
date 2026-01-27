import { listProjects } from "../data/storage";

export async function listCommand(): Promise<void> {
	const projects = await listProjects();

	if (projects.length === 0) {
		console.log("No projects found. Create one with 'dft new <name>'");
		process.exit(0);
	}

	console.log("Projects:");
	for (const project of projects) {
		const taskCount = project.nodeCount - 1;
		const taskWord = taskCount === 1 ? "task" : "tasks";
		console.log(`  • ${project.name} (${taskCount} ${taskWord})`);
	}

	process.exit(0);
}
