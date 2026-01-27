#!/usr/bin/env bun

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

program
	.command("new <project_name>")
	.aliases(["create", "init", "add"])
	.description("Create a new project")
	.action(async (projectName: string) => {
		await newCommand(projectName);
	});

program
	.command("list")
	.aliases(["ls", "show", "projects"])
	.description("List all projects sorted by creation date")
	.action(async () => {
		await listCommand();
	});

program
	.command("delete <project_name>")
	.aliases(["rm", "remove"])
	.description("Delete an existing project")
	.option("-y, --yes", "Skip confirmation prompt")
	.action(async (projectName: string, options: { yes?: boolean }) => {
		await deleteCommand(projectName, options);
	});

program
	.command("open <project_name>")
	.aliases(["use", "start", "run"])
	.description("Launch the interactive TUI session")
	.action(async (projectName: string) => {
		await openCommand(projectName);
	});

program
	.command("tree <project_name>")
	.aliases(["view"])
	.description("Print the tree structure to stdout")
	.option("--show-status", "Show status markers (default: true)")
	.option("--no-status", "Hide status markers")
	.action(async (projectName: string, options: { status?: boolean }) => {
		await treeCommand(projectName, options);
	});

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

	if (args.length === 0) {
		await listCommand();
		return;
	}

	if (
		args.length > 0 &&
		!args[0].startsWith("-") &&
		!knownCommands.includes(args[0]) &&
		isValidProjectName(args[0])
	) {
		process.argv.splice(2, 0, "open");
	}

	await program.parseAsync(process.argv);
}

main().catch((error) => {
	console.error("Error:", error.message || error);
	process.exit(1);
});
