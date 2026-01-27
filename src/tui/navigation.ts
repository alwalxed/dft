/**
 * Navigation for list-based tree navigation
 *
 * Navigation model:
 * - Root is not selectable, we view its children as a list
 * - Stack contains parent node IDs (empty = viewing root's children)
 * - selectedIndex tracks cursor position in current list
 * - Up/down moves within list, right/enter dives in, left goes back
 */

import { findNode } from "../data/operations";
import type { AppState, Node } from "../data/types";

/**
 * Navigation result with optional feedback message
 */
export interface NavigationResult {
	success: boolean;
	feedbackMessage?: string;
}

/**
 * Gets the current list of items being viewed
 *
 * @param state - The application state
 * @returns Array of nodes in the current list
 */
export function getCurrentList(state: AppState): Node[] {
	if (state.navigationStack.length === 0) {
		// Viewing root's children
		return state.project.root.children;
	}

	// Get the last node in stack - that's the parent whose children we're viewing
	const parentId = state.navigationStack[state.navigationStack.length - 1];
	const parent = findNode(state.project.root, parentId);

	if (!parent) {
		// Fallback to root children if parent not found
		return state.project.root.children;
	}

	return parent.children;
}

/**
 * Gets the currently selected node
 *
 * @param state - The application state
 * @returns The selected node, or null if list is empty
 */
export function getSelectedNode(state: AppState): Node | null {
	const list = getCurrentList(state);
	if (list.length === 0 || state.selectedIndex >= list.length) {
		return null;
	}
	return list[state.selectedIndex] || null;
}

/**
 * Gets the current parent node (whose children we're viewing)
 *
 * @param state - The application state
 * @returns The parent node, or null if at root level
 */
export function getCurrentParent(state: AppState): Node | null {
	if (state.navigationStack.length === 0) {
		return null; // At root level
	}

	const parentId = state.navigationStack[state.navigationStack.length - 1];
	return findNode(state.project.root, parentId);
}

/**
 * Gets the breadcrumb path (list of parent nodes)
 *
 * @param state - The application state
 * @returns Array of nodes from root to current parent
 */
export function getBreadcrumbPath(state: AppState): Node[] {
	const path: Node[] = [];

	for (const nodeId of state.navigationStack) {
		const node = findNode(state.project.root, nodeId);
		if (node) {
			path.push(node);
		}
	}

	return path;
}

/**
 * Moves selection up (previous item in list)
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function moveUp(state: AppState): NavigationResult {
	const list = getCurrentList(state);

	if (list.length === 0) {
		return { success: false, feedbackMessage: "List is empty" };
	}

	if (state.selectedIndex <= 0) {
		return { success: false, feedbackMessage: "At top" };
	}

	state.selectedIndex--;
	return { success: true };
}

/**
 * Moves selection down (next item in list)
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function moveDown(state: AppState): NavigationResult {
	const list = getCurrentList(state);

	if (list.length === 0) {
		return { success: false, feedbackMessage: "List is empty" };
	}

	if (state.selectedIndex >= list.length - 1) {
		return { success: false, feedbackMessage: "At bottom" };
	}

	state.selectedIndex++;
	return { success: true };
}

/**
 * Dives into the selected node (view its children)
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function diveIn(state: AppState): NavigationResult {
	const selected = getSelectedNode(state);

	if (!selected) {
		return { success: false, feedbackMessage: "Nothing selected" };
	}

	// Push selected node to stack (now viewing its children)
	// Allow entering even empty tasks so user can create subtasks inside
	state.navigationStack.push(selected.id);
	state.selectedIndex = 0;
	return { success: true };
}

/**
 * Goes back to parent list
 *
 * @param state - The application state (modified in place)
 * @returns Navigation result
 */
export function goBack(state: AppState): NavigationResult {
	if (state.navigationStack.length === 0) {
		return { success: false, feedbackMessage: "At root" };
	}

	// Pop the last parent from stack
	state.navigationStack.pop();
	state.selectedIndex = 0;
	return { success: true };
}

/**
 * Initializes navigation to view root's children
 *
 * @param state - The application state (modified in place)
 */
export function initializeNavigation(state: AppState): void {
	state.navigationStack = [];
	state.selectedIndex = 0;
}

/**
 * Adjusts selectedIndex after a deletion to stay within bounds
 *
 * @param state - The application state (modified in place)
 * @param deletedIndex - The index of the deleted item
 */
export function adjustSelectionAfterDelete(state: AppState, deletedIndex: number): void {
	const list = getCurrentList(state);

	if (list.length === 0) {
		state.selectedIndex = 0;
		return;
	}

	// If deleted item was at or before selection, move selection up
	if (deletedIndex <= state.selectedIndex && state.selectedIndex > 0) {
		state.selectedIndex--;
	}

	// Ensure selection is within bounds
	if (state.selectedIndex >= list.length) {
		state.selectedIndex = list.length - 1;
	}
}

/**
 * Ensures selectedIndex is valid for current list
 *
 * @param state - The application state (modified in place)
 */
export function ensureValidSelection(state: AppState): void {
	const list = getCurrentList(state);

	if (list.length === 0) {
		state.selectedIndex = 0;
		return;
	}

	if (state.selectedIndex < 0) {
		state.selectedIndex = 0;
	}

	if (state.selectedIndex >= list.length) {
		state.selectedIndex = list.length - 1;
	}
}
