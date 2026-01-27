#!/usr/bin/env bun
/**
 * dft - Depth-First Thinking
 * A terminal-based todo-list tool that manages workflows using tree structures
 */

import { Command } from "commander";
import { deleteCommand } from "./commands/delete";
import { listCommand } from "./commands/list";
import { newCommand } from "./commands/new";
import { openCommand } from "./commands/open";
import { treeCommand } from "./commands/tree";
import { isValidProjectName } from "./utils/validation";

const program = new Command();

program
	.name("dft")
	.description("Depth-First Thinking - Solve problems the depth-first way")
	.version("1.0.0");

// dft new|create|init <project_name> <root_title...>
// Using variadic argument to capture multi-word titles without quotes
program
	.command("new <project_name> <root_title...>")
	.aliases(["create", "init", "add"])
	.description("Create a new project with an initial root problem")
	.action(async (projectName: string, rootTitleParts: string[]) => {
		const rootTitle = rootTitleParts.join(" ");
		await newCommand(projectName, rootTitle);
	});

// dft list|ls|show|projects
program
	.command("list")
	.aliases(["ls", "show", "projects"])
	.description("List all projects sorted by creation date")
	.action(async () => {
		await listCommand();
	});

// dft delete|rm|remove <project_name>
program
	.command("delete <project_name>")
	.aliases(["rm", "remove"])
	.description("Delete an existing project")
	.option("-y, --yes", "Skip confirmation prompt")
	.action(async (projectName: string, options: { yes?: boolean }) => {
		await deleteCommand(projectName, options);
	});

// dft open|use|start|run <project_name>
program
	.command("open <project_name>")
	.aliases(["use", "start", "run"])
	.description("Launch the interactive TUI session")
	.action(async (projectName: string) => {
		await openCommand(projectName);
	});

// dft tree|view <project_name>
program
	.command("tree <project_name>")
	.aliases(["view"])
	.description("Print the tree structure to stdout")
	.option("--show-status", "Show status markers (default: true)")
	.option("--no-status", "Hide status markers")
	.action(async (projectName: string, options: { status?: boolean }) => {
		await treeCommand(projectName, options);
	});

// All known commands and their aliases
const knownCommands = [
	"new",
	"create",
	"init",
	"add",
	"list",
	"ls",
	"show",
	"projects",
	"delete",
	"rm",
	"remove",
	"open",
	"use",
	"start",
	"run",
	"tree",
	"view",
	"help",
];

async function main() {
	const args = process.argv.slice(2);

	// No arguments - default to list
	if (args.length === 0) {
		await listCommand();
		return;
	}

	// Handle shorthand: dft <project_name> when first arg is not a known command
	if (
		args.length > 0 &&
		!args[0].startsWith("-") &&
		!knownCommands.includes(args[0]) &&
		isValidProjectName(args[0])
	) {
		// Insert "open" command
		process.argv.splice(2, 0, "open");
	}

	await program.parseAsync(process.argv);
}

main().catch((error) => {
	console.error("Error:", error.message || error);
	process.exit(1);
});
