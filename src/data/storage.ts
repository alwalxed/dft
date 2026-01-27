import { mkdir, readdir, rename, rm } from "node:fs/promises";
import { getProjectPath, getProjectsDir } from "../utils/platform";
import type { Node, Project } from "./types";

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

	for (let i = 0; i < n.children.length; i++) {
		validateNode(n.children[i], `${path}.children[${i}]`);
	}

	return true;
}

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

export async function ensureProjectsDir(): Promise<void> {
	const dir = getProjectsDir();
	await mkdir(dir, { recursive: true });
}

export async function projectExists(name: string): Promise<boolean> {
	const path = getProjectPath(name);
	const file = Bun.file(path);
	return await file.exists();
}

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
		try {
			await rm(tempPath, { force: true });
		} catch {
			// Ignore cleanup errors
		}
		throw new Error(`Cannot write to project directory. Check permissions. ${error}`);
	}
}

export async function listProjects(): Promise<
	Array<{ name: string; nodeCount: number; createdAt: string }>
> {
	const dir = getProjectsDir();

	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		return [];
	}

	const projects: Array<{
		name: string;
		nodeCount: number;
		createdAt: string;
	}> = [];

	for (const file of files) {
		if (!file.endsWith(".json")) continue;

		const name = file.slice(0, -5);
		try {
			const project = await loadProject(name);
			const countNodes = (node: Node): number => {
				let count = 1;
				for (const child of node.children) {
					count += countNodes(child);
				}
				return count;
			};
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

	projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

	return projects;
}

export async function getMostOpenedProject(): Promise<string | null> {
	const dir = getProjectsDir();

	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		return null;
	}

	let mostOpenedProject: { name: string; openCount: number } | null = null;

	for (const file of files) {
		if (!file.endsWith(".json")) continue;

		const name = file.slice(0, -5);
		try {
			const project = await loadProject(name);
			const openCount = project.open_count ?? 0;

			if (openCount > 0) {
				if (
					!mostOpenedProject ||
					openCount > mostOpenedProject.openCount ||
					(openCount === mostOpenedProject.openCount &&
						project.project_name < mostOpenedProject.name)
				) {
					mostOpenedProject = {
						name: project.project_name,
						openCount,
					};
				}
			}
		} catch {}
	}

	return mostOpenedProject?.name ?? null;
}

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
