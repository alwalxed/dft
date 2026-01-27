/**
 * Display formatting utilities for breadcrumbs and text truncation
 */

import type { Node } from "../data/types";

/**
 * Truncates a string to a maximum length with ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Formats breadcrumbs from a path of nodes
 * - Shows path to parent, not current node
 * - Individual segments truncated to 20 characters
 * - If total > 60 characters, uses "... > Grandparent > Parent"
 *
 * @param path - Array of nodes from root to current
 * @param projectName - Project name to show at root level
 * @returns Formatted breadcrumb string
 */
export function formatBreadcrumbs(path: Node[], projectName: string): string {
	// At root level, show project name only
	if (path.length <= 1) {
		return truncate(projectName, 60);
	}

	// Build path to parent (exclude current node)
	const parentPath = path.slice(0, -1);
	const segments = parentPath.map((node) => truncate(node.title, 20));

	let breadcrumbs = segments.join(" > ");

	// If total > 60 characters, truncate from the start
	if (breadcrumbs.length > 60) {
		// Keep removing from start until it fits
		while (segments.length > 1 && breadcrumbs.length > 57) {
			// 57 = 60 - "... > ".length + 3
			segments.shift();
			breadcrumbs = segments.join(" > ");
		}
		breadcrumbs = `... > ${breadcrumbs}`;
	}

	return breadcrumbs;
}

/**
 * Counts all descendants of a node recursively
 *
 * @param node - The node to count descendants for
 * @returns Total number of descendants
 */
export function countDescendants(node: Node): number {
	let count = node.children.length;
	for (const child of node.children) {
		count += countDescendants(child);
	}
	return count;
}

/**
 * Counts all nodes in a tree (including the root)
 *
 * @param root - The root node
 * @returns Total number of nodes
 */
export function countAllNodes(root: Node): number {
	return 1 + countDescendants(root);
}

/**
 * Formats a status badge for display
 *
 * @param status - The node status
 * @returns Formatted status badge
 */
export function formatStatusBadge(status: "open" | "done"): string {
	return status === "done" ? "[DONE]" : "[OPEN]";
}

/**
 * Formats a checkbox marker for tree display
 *
 * @param status - The node status
 * @returns Checkbox marker
 */
export function formatCheckbox(status: "open" | "done"): string {
	return status === "done" ? "[x]" : "[ ]";
}
