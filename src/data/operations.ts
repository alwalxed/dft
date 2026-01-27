import { v4 as uuidv4 } from "uuid";
import type { Node } from "./types";

export function addChildNode(parent: Node, title: string): Node {
	const newNode = {
		id: uuidv4(),
		title: title.trim(),
		status: "open" as const,
		children: [],
		created_at: new Date().toISOString(),
		completed_at: null,
	};
	parent.children.push(newNode);
	return newNode;
}

export function editNodeTitle(node: Node, newTitle: string): void {
	node.title = newTitle.trim();
}

export function markNodeDone(node: Node): void {
	node.status = "done";
	node.completed_at = new Date().toISOString();
	for (const child of node.children) {
		markNodeDone(child);
	}
}

export function markNodeOpen(node: Node): void {
	node.status = "open";
	node.completed_at = null;
}

export function toggleNodeStatus(node: Node): void {
	if (node.status === "open") {
		markNodeDone(node);
	} else {
		markNodeOpen(node);
	}
}

export function deleteNode(parent: Node, nodeId: string): boolean {
	const index = parent.children.findIndex((c) => c.id === nodeId);
	if (index === -1) return false;
	parent.children.splice(index, 1);
	return true;
}

export function findNode(root: Node, id: string): Node | null {
	if (root.id === id) return root;
	for (const child of root.children) {
		const found = findNode(child, id);
		if (found) return found;
	}
	return null;
}

export function findParent(root: Node, childId: string): Node | null {
	for (const child of root.children) {
		if (child.id === childId) return root;
		const found = findParent(child, childId);
		if (found) return found;
	}
	return null;
}

export function buildPathToNode(root: Node, targetId: string): string[] | null {
	if (root.id === targetId) return [root.id];
	for (const child of root.children) {
		const path = buildPathToNode(child, targetId);
		if (path) return [root.id, ...path];
	}
	return null;
}

export function getNodePath(root: Node, targetId: string): Node[] | null {
	if (root.id === targetId) return [root];
	for (const child of root.children) {
		const path = getNodePath(child, targetId);
		if (path) return [root, ...path];
	}
	return null;
}

export function getSiblings(parent: Node): Node[] {
	return parent.children;
}

export function getSiblingIndex(siblings: Node[], nodeId: string): number {
	return siblings.findIndex((s) => s.id === nodeId);
}

export function getPreviousSibling(siblings: Node[], nodeId: string): Node | null {
	const index = getSiblingIndex(siblings, nodeId);
	if (index <= 0) return null;
	return siblings[index - 1];
}

export function getNextSibling(siblings: Node[], nodeId: string): Node | null {
	const index = getSiblingIndex(siblings, nodeId);
	if (index === -1 || index >= siblings.length - 1) return null;
	return siblings[index + 1];
}

export function countDescendants(node: Node): number {
	let count = node.children.length;
	for (const child of node.children) {
		count += countDescendants(child);
	}
	return count;
}
