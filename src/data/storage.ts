/**
 * File I/O operations for projects (load, save, list, delete)
 */

import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { getProjectPath, getProjectsDir } from "../utils/platform";
import type { Node, Project } from "./types";

/**
 * Validates that a node has the required structure
 */
function validateNode(node: unknown, path = "root"): node is Node {
	if (!node || typeof node !== "object") {
		throw new Error(`Invalid node at ${path}: expected object`);
	}

	const n = node as Record<string, unknown>;

	if (typeof n.id !== "string" || n.id.length !== 36) {
		throw new Error(`Invalid node at ${path}: id must be a 36-character UUID`);
	}

	if (typeof n.title !== "string" || n.title.length < 1 || n.title.length > 200) {
		throw new Error(`Invalid node at ${path}: title must be 1-200 characters`);
	}

	if (n.status !== "open" && n.status !== "done") {
		throw new Error(`Invalid node at ${path}: status must be "open" or "done"`);
	}

	if (!Array.isArray(n.children)) {
		throw new Error(`Invalid node at ${path}: children must be an array`);
	}

	if (typeof n.created_at !== "string") {
		throw new Error(`Invalid node at ${path}: created_at must be a string`);
	}

	if (n.completed_at !== null && typeof n.completed_at !== "string") {
		throw new Error(`Invalid node at ${path}: completed_at must be string or null`);
	}

	// Validate children recursively
	for (let i = 0; i < n.children.length; i++) {
		validateNode(n.children[i], `${path}.children[${i}]`);
	}

	return true;
}

/**
 * Validates that a project has the required structure
 */
function validateProjectSchema(project: unknown): project is Project {
	if (!project || typeof project !== "object") {
		throw new Error("Project must be an object");
	}

	const p = project as Record<string, unknown>;

	if (typeof p.project_name !== "string") {
		throw new Error("Project must have a project_name string");
	}

	if (typeof p.version !== "string") {
		throw new Error("Project must have a version string");
	}

	if (typeof p.created_at !== "string") {
		throw new Error("Project must have a created_at timestamp");
	}

	if (typeof p.modified_at !== "string") {
		throw new Error("Project must have a modified_at timestamp");
	}

	validateNode(p.root);

	return true;
}

/**
 * Ensures the projects directory exists
 */
export async function ensureProjectsDir(): Promise<void> {
	const dir = getProjectsDir();
	await mkdir(dir, { recursive: true });
}

/**
 * Checks if a project exists
 *
 * @param name - The project name
 * @returns true if the project exists
 */
export async function projectExists(name: string): Promise<boolean> {
	const path = getProjectPath(name);
	const file = Bun.file(path);
	return await file.exists();
}

/**
 * Loads a project from disk
 *
 * @param name - The project name
 * @returns The loaded project
 * @throws Error if the project doesn't exist or is corrupted
 */
export async function loadProject(name: string): Promise<Project> {
	const path = getProjectPath(name);
	const file = Bun.file(path);

	if (!(await file.exists())) {
		throw new Error(`Project '${name}' not found. Use 'dft list' to see available projects.`);
	}

	let project: unknown;
	try {
		project = await file.json();
	} catch {
		throw new Error(`Project '${name}' has invalid JSON. The file may be corrupted.`);
	}

	try {
		validateProjectSchema(project);
	} catch (error) {
		const detail = error instanceof Error ? error.message : "Unknown error";
		throw new Error(`Project '${name}' has invalid structure: ${detail}`);
	}

	return project as Project;
}

/**
 * Saves a project to disk (atomic write using temp file and rename)
 *
 * @param project - The project to save
 */
export async function saveProject(project: Project): Promise<void> {
	await ensureProjectsDir();

	project.modified_at = new Date().toISOString();
	const json = JSON.stringify(project, null, 2);
	const projectPath = getProjectPath(project.project_name);
	const tempPath = `${projectPath}.tmp`;

	try {
		await Bun.write(tempPath, json);
		await rename(tempPath, projectPath);
	} catch (error) {
		// Try to clean up temp file
		try {
			await rm(tempPath, { force: true });
		} catch {
			// Ignore cleanup errors
		}
		throw new Error(`Cannot write to project directory. Check permissions. ${error}`);
	}
}

/**
 * Lists all projects sorted by creation date (newest first)
 *
 * @returns Array of project info objects
 */
export async function listProjects(): Promise<
	Array<{ name: string; nodeCount: number; createdAt: string }>
> {
	const dir = getProjectsDir();

	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		// Directory doesn't exist yet
		return [];
	}

	const projects: Array<{
		name: string;
		nodeCount: number;
		createdAt: string;
	}> = [];

	for (const file of files) {
		if (!file.endsWith(".json")) continue;

		const name = file.slice(0, -5); // Remove .json extension
		try {
			const project = await loadProject(name);
			const nodeCount = countNodes(project.root);
			projects.push({
				name: project.project_name,
				nodeCount,
				createdAt: project.created_at,
			});
		} catch {
			// Skip corrupted files
		}
	}

	// Sort by creation date (newest first)
	projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return projects;
}

/**
 * Deletes a project
 *
 * @param name - The project name
 * @throws Error if the project doesn't exist
 */
export async function deleteProject(name: string): Promise<void> {
	const path = getProjectPath(name);
	const file = Bun.file(path);

	if (!(await file.exists())) {
		throw new Error(`Project '${name}' not found. Use 'dft list' to see available projects.`);
	}

	try {
		await rm(path);
	} catch {
		throw new Error("Cannot delete project file. Check permissions.");
	}
}

/**
 * Counts all nodes in a tree
 */
function countNodes(node: Node): number {
	let count = 1;
	for (const child of node.children) {
		count += countNodes(child);
	}
	return count;
}
