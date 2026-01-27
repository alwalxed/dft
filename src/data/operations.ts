/**
 * Tree operations for nodes (add, edit, delete, toggle status)
 */

import { v4 as uuidv4 } from "uuid";
import type { Node } from "./types";

/**
 * Creates a new node
 *
 * @param title - The node title (will be trimmed)
 * @returns A new node with generated UUID and timestamps
 */
export function createNode(title: string): Node {
	return {
		id: uuidv4(),
		title: title.trim(),
		status: "open",
		children: [],
		created_at: new Date().toISOString(),
		completed_at: null,
	};
}

/**
 * Adds a new child node to a parent
 *
 * @param parent - The parent node
 * @param title - The child's title
 * @returns The newly created child node
 */
export function addChildNode(parent: Node, title: string): Node {
	const newNode = createNode(title);
	parent.children.push(newNode);
	return newNode;
}

/**
 * Edits a node's title
 *
 * @param node - The node to edit
 * @param newTitle - The new title (will be trimmed)
 */
export function editNodeTitle(node: Node, newTitle: string): void {
	node.title = newTitle.trim();
}

/**
 * Marks a node and all its descendants as done (cascade)
 *
 * @param node - The node to mark as done
 */
export function markNodeDone(node: Node): void {
	node.status = "done";
	node.completed_at = new Date().toISOString();
	// Recursively mark all descendants as done
	for (const child of node.children) {
		markNodeDone(child);
	}
}

/**
 * Marks a single node as open (no cascade)
 *
 * @param node - The node to mark as open
 */
export function markNodeOpen(node: Node): void {
	node.status = "open";
	node.completed_at = null;
}

/**
 * Toggles a node's status between open and done
 * - If open -> marks done (cascades to all children)
 * - If done -> marks open (single node only)
 *
 * @param node - The node to toggle
 */
export function toggleNodeStatus(node: Node): void {
	if (node.status === "open") {
		markNodeDone(node);
	} else {
		markNodeOpen(node);
	}
}

/**
 * Deletes a node from its parent's children array
 *
 * @param parent - The parent node
 * @param nodeId - The ID of the node to delete
 * @returns true if the node was deleted, false if not found
 */
export function deleteNode(parent: Node, nodeId: string): boolean {
	const index = parent.children.findIndex((c) => c.id === nodeId);
	if (index === -1) return false;
	parent.children.splice(index, 1);
	return true;
}

/**
 * Finds a node by ID in the tree
 *
 * @param root - The root node to search from
 * @param id - The ID to find
 * @returns The node if found, null otherwise
 */
export function findNode(root: Node, id: string): Node | null {
	if (root.id === id) return root;
	for (const child of root.children) {
		const found = findNode(child, id);
		if (found) return found;
	}
	return null;
}

/**
 * Finds the parent of a node by child ID
 *
 * @param root - The root node to search from
 * @param childId - The ID of the child whose parent to find
 * @returns The parent node if found, null otherwise
 */
export function findParent(root: Node, childId: string): Node | null {
	for (const child of root.children) {
		if (child.id === childId) return root;
		const found = findParent(child, childId);
		if (found) return found;
	}
	return null;
}

/**
 * Builds the path (array of node IDs) from root to a target node
 *
 * @param root - The root node
 * @param targetId - The ID of the target node
 * @returns Array of node IDs from root to target, or null if not found
 */
export function buildPathToNode(root: Node, targetId: string): string[] | null {
	if (root.id === targetId) return [root.id];
	for (const child of root.children) {
		const path = buildPathToNode(child, targetId);
		if (path) return [root.id, ...path];
	}
	return null;
}

/**
 * Gets the path of nodes (not just IDs) from root to target
 *
 * @param root - The root node
 * @param targetId - The ID of the target node
 * @returns Array of nodes from root to target, or null if not found
 */
export function getNodePath(root: Node, targetId: string): Node[] | null {
	if (root.id === targetId) return [root];
	for (const child of root.children) {
		const path = getNodePath(child, targetId);
		if (path) return [root, ...path];
	}
	return null;
}

/**
 * Gets siblings of a node (including the node itself)
 *
 * @param parent - The parent node
 * @returns Array of sibling nodes
 */
export function getSiblings(parent: Node): Node[] {
	return parent.children;
}

/**
 * Gets the index of a node within its siblings
 *
 * @param siblings - Array of sibling nodes
 * @param nodeId - The ID of the node
 * @returns The index, or -1 if not found
 */
export function getSiblingIndex(siblings: Node[], nodeId: string): number {
	return siblings.findIndex((s) => s.id === nodeId);
}

/**
 * Gets the previous sibling of a node
 *
 * @param siblings - Array of sibling nodes
 * @param nodeId - The ID of the current node
 * @returns The previous sibling, or null if at first position
 */
export function getPreviousSibling(siblings: Node[], nodeId: string): Node | null {
	const index = getSiblingIndex(siblings, nodeId);
	if (index <= 0) return null;
	return siblings[index - 1];
}

/**
 * Gets the next sibling of a node
 *
 * @param siblings - Array of sibling nodes
 * @param nodeId - The ID of the current node
 * @returns The next sibling, or null if at last position
 */
export function getNextSibling(siblings: Node[], nodeId: string): Node | null {
	const index = getSiblingIndex(siblings, nodeId);
	if (index === -1 || index >= siblings.length - 1) return null;
	return siblings[index + 1];
}

/**
 * Counts all descendants of a node
 *
 * @param node - The node to count descendants for
 * @returns Total number of descendants (not including the node itself)
 */
export function countDescendants(node: Node): number {
	let count = node.children.length;
	for (const child of node.children) {
		count += countDescendants(child);
	}
	return count;
}
