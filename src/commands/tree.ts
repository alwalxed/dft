/**
 * dft tree <project_name>
 * Print the tree structure to stdout (non-interactive)
 */

import { loadProject } from "../data/storage";
import type { Node } from "../data/types";
import { ExitCodes } from "../data/types";
import { formatCheckbox } from "../utils/formatting";
import { normalizeProjectName } from "../utils/validation";

/**
 * Prints a node and its children recursively
 *
 * @param node - The node to print
 * @param indent - Current indentation level
 * @param showStatus - Whether to show status markers
 */
function printNode(node: Node, indent: number, showStatus: boolean): void {
	const indentStr = "  ".repeat(indent);
	const status = showStatus ? `${formatCheckbox(node.status)} ` : "";
	console.log(`${indentStr}${status}${node.title}`);

	for (const child of node.children) {
		printNode(child, indent + 1, showStatus);
	}
}

/**
 * Prints the tree structure of a project
 *
 * @param projectName - The name of the project
 * @param options - Command options
 */
export async function treeCommand(
	projectName: string,
	options: { status?: boolean },
): Promise<void> {
	const normalizedName = normalizeProjectName(projectName);
	const showStatus = options.status !== false; // Default to true

	try {
		const project = await loadProject(normalizedName);
		printNode(project.root, 0, showStatus);
		process.exit(ExitCodes.SUCCESS);
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
}
