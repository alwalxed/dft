import { loadProject } from "../data/storage";
import type { Node } from "../data/types";
import { ExitCodes } from "../data/types";
import { formatCheckbox } from "../utils/formatting";

function printNode(node: Node, indent: number, showStatus: boolean): void {
	const indentStr = "  ".repeat(indent);
	const status = showStatus ? `${formatCheckbox(node.status)} ` : "";
	console.log(`${indentStr}${status}${node.title}`);

	for (const child of node.children) {
		printNode(child, indent + 1, showStatus);
	}
}

export async function treeCommand(
	projectName: string,
	options: { status?: boolean },
): Promise<void> {
	const normalizedName = projectName.toLowerCase();
	const showStatus = options.status !== false;

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
