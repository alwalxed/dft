/**
 * Navigation stack management for depth-first tree navigation
 */

import {
	findNode,
	findParent,
	getNextSibling,
	getNodePath,
	getPreviousSibling,
} from "../data/operations";
import type { AppState, Node } from "../data/types";

/**
 * Gets the current node from the navigation stack
 *
 * @param state - The application state
 * @returns The current node
 */
export function getCurrentNode(state: AppState): Node {
	const currentId = state.navigationStack[state.navigationStack.length - 1];
	const node = findNode(state.project.root, currentId);
	if (!node) {
		throw new Error("Current node not found - navigation stack is corrupted");
	}
	return node;
}

/**
 * Gets the parent of the current node
 *
 * @param state - The application state
 * @returns The parent node, or null if at root
 */
export function getParentNode(state: AppState): Node | null {
	if (state.navigationStack.length <= 1) {
		return null; // At root, no parent
	}
	const parentId = state.navigationStack[state.navigationStack.length - 2];
	return findNode(state.project.root, parentId);
}

/**
 * Gets the path of nodes from root to current
 *
 * @param state - The application state
 * @returns Array of nodes from root to current
 */
export function getNodePathFromState(state: AppState): Node[] {
	const currentId = state.navigationStack[state.navigationStack.length - 1];
	return getNodePath(state.project.root, currentId) || [state.project.root];
}

/**
 * Gets siblings of the current node
 *
 * @param state - The application state
 * @returns Array of sibling nodes (including current)
 */
export function getSiblingsFromState(state: AppState): Node[] {
	const parent = getParentNode(state);
	if (!parent) {
		// At root, no siblings
		return [state.project.root];
	}
	return parent.children;
}

/**
 * Navigation result with optional feedback message
 */
interface NavigationResult {
	success: boolean;
	feedbackMessage?: string;
}

/**
 * Moves to the previous sibling
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function moveToPreviousSibling(state: AppState): NavigationResult {
	const siblings = getSiblingsFromState(state);
	const currentId = state.navigationStack[state.navigationStack.length - 1];

	if (siblings.length === 1) {
		return { success: false, feedbackMessage: "No siblings" };
	}

	const prevSibling = getPreviousSibling(siblings, currentId);
	if (!prevSibling) {
		return { success: false, feedbackMessage: "No previous sibling" };
	}

	// Replace last entry with sibling's ID
	state.navigationStack[state.navigationStack.length - 1] = prevSibling.id;
	return { success: true };
}

/**
 * Moves to the next sibling
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function moveToNextSibling(state: AppState): NavigationResult {
	const siblings = getSiblingsFromState(state);
	const currentId = state.navigationStack[state.navigationStack.length - 1];

	if (siblings.length === 1) {
		return { success: false, feedbackMessage: "No siblings" };
	}

	const nextSibling = getNextSibling(siblings, currentId);
	if (!nextSibling) {
		return { success: false, feedbackMessage: "No next sibling" };
	}

	// Replace last entry with sibling's ID
	state.navigationStack[state.navigationStack.length - 1] = nextSibling.id;
	return { success: true };
}

/**
 * Dives into the first child of the current node
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function diveIntoChild(state: AppState): NavigationResult {
	const current = getCurrentNode(state);

	if (current.children.length === 0) {
		return { success: false, feedbackMessage: "No children" };
	}

	// Push first child's ID to stack
	state.navigationStack.push(current.children[0].id);
	return { success: true };
}

/**
 * Goes back to the parent node
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function goToParent(state: AppState): NavigationResult {
	if (state.navigationStack.length <= 1) {
		return { success: false, feedbackMessage: "Already at root" };
	}

	// Pop the last entry
	state.navigationStack.pop();
	return { success: true };
}

/**
 * Navigates to a specific node by ID
 *
 * @param state - The application state (modified in place)
 * @param nodeId - The ID of the node to navigate to
 * @returns Navigation result
 */
export function navigateToNode(state: AppState, nodeId: string): NavigationResult {
	const path = getNodePath(state.project.root, nodeId);
	if (!path) {
		return { success: false, feedbackMessage: "Node not found" };
	}

	state.navigationStack = path.map((n) => n.id);
	return { success: true };
}

/**
 * Initializes the navigation stack to the root
 *
 * @param state - The application state (modified in place)
 */
export function initializeNavigation(state: AppState): void {
	state.navigationStack = [state.project.root.id];
}

/**
 * Handles navigation after a node is deleted
 * - Tries to move to previous sibling
 * - Falls back to parent if no siblings
 *
 * @param state - The application state
 * @param deletedNodeId - The ID of the deleted node
 * @param siblings - The siblings before deletion
 * @param siblingIndex - The index of the deleted node in siblings
 */
export function handlePostDeleteNavigation(
	state: AppState,
	deletedNodeId: string,
	siblings: Node[],
	siblingIndex: number,
): void {
	// Remove the deleted node from navigation stack if present
	const deleteIndex = state.navigationStack.indexOf(deletedNodeId);
	if (deleteIndex !== -1) {
		state.navigationStack = state.navigationStack.slice(0, deleteIndex);
	}

	// Decide where to navigate
	if (siblings.length > 1) {
		// Navigate to previous sibling, or next if first
		const newIndex = siblingIndex > 0 ? siblingIndex - 1 : 0;
		const newSiblings = siblings.filter((s) => s.id !== deletedNodeId);
		if (newSiblings[newIndex]) {
			state.navigationStack.push(newSiblings[newIndex].id);
		}
	}
	// If no siblings remain, we stay at parent (already handled by slice)
}
