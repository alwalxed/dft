import { findNode } from "../data/operations";
import type { AppState, Node } from "../data/types";

export interface NavigationResult {
	success: boolean;
	feedbackMessage?: string;
}

export function getCurrentList(state: AppState): Node[] {
	if (state.navigationStack.length === 0) {
		return state.project.root.children;
	}

	const parentId = state.navigationStack[state.navigationStack.length - 1];
	const parent = findNode(state.project.root, parentId);

	if (!parent) {
		return state.project.root.children;
	}

	return parent.children;
}

export function getSelectedNode(state: AppState): Node | null {
	const list = getCurrentList(state);
	if (list.length === 0 || state.selectedIndex >= list.length) {
		return null;
	}
	return list[state.selectedIndex] || null;
}

export function getCurrentParent(state: AppState): Node | null {
	if (state.navigationStack.length === 0) {
		return null;
	}

	const parentId = state.navigationStack[state.navigationStack.length - 1];
	return findNode(state.project.root, parentId);
}

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

export function diveIn(state: AppState): NavigationResult {
	const selected = getSelectedNode(state);

	if (!selected) {
		return { success: false, feedbackMessage: "Nothing selected" };
	}

	state.navigationStack.push(selected.id);
	state.selectedIndex = 0;
	return { success: true };
}

export function goBack(state: AppState): NavigationResult {
	if (state.navigationStack.length === 0) {
		return { success: false, feedbackMessage: "At root" };
	}

	state.navigationStack.pop();
	state.selectedIndex = 0;
	return { success: true };
}

export function initializeNavigation(state: AppState): void {
	state.navigationStack = [];
	state.selectedIndex = 0;
}

export function adjustSelectionAfterDelete(state: AppState, deletedIndex: number): void {
	const list = getCurrentList(state);

	if (list.length === 0) {
		state.selectedIndex = 0;
		return;
	}

	if (deletedIndex <= state.selectedIndex && state.selectedIndex > 0) {
		state.selectedIndex--;
	}

	if (state.selectedIndex >= list.length) {
		state.selectedIndex = list.length - 1;
	}
}

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
