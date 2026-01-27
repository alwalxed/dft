/**
 * UI rendering logic for the TUI
 */

import { Box, type CliRenderer } from "@opentui/core";
import { getNextSibling, getPreviousSibling, getSiblingIndex } from "../data/operations";
import type { AppState } from "../data/types";
import { countDescendants } from "../utils/formatting";
import {
	BreadcrumbBar,
	ChildrenList,
	CurrentNodeDisplay,
	FeedbackMessage,
	KeyHintsBar,
	SiblingIndicators,
	colors,
} from "./components";
import { createModal } from "./modals";
import {
	getCurrentNode,
	getNodePathFromState,
	getParentNode,
	getSiblingsFromState,
} from "./navigation";

// Use generic type for OpenTUI components
// biome-ignore lint/suspicious/noExplicitAny: OpenTUI VNode types are complex
type UIComponent = any;

/**
 * Renders the entire UI based on the current state
 */
export function renderUI(renderer: CliRenderer, state: AppState): void {
	// Get terminal dimensions from process
	const width = process.stdout.columns || 80;
	const height = process.stdout.rows || 24;

	// Get current node info
	const currentNode = getCurrentNode(state);
	const nodePath = getNodePathFromState(state);
	const parent = getParentNode(state);
	const siblings = getSiblingsFromState(state);
	const siblingIndex = getSiblingIndex(siblings, currentNode.id);

	// Get adjacent siblings
	const prevSibling = getPreviousSibling(siblings, currentNode.id);
	const nextSibling = getNextSibling(siblings, currentNode.id);

	// Calculate available height for children list
	const fixedHeight = 8; // breadcrumb + current node + siblings + key hints + feedback
	const childrenHeight = Math.max(3, height - fixedHeight);

	// Build the main layout
	const mainContent: UIComponent[] = [
		// Breadcrumb bar
		BreadcrumbBar(nodePath, state.project.project_name, width),

		// Separator
		Box({
			width,
			height: 1,
			borderStyle: "single",
			borderColor: colors.border,
		}),

		// Current node display
		CurrentNodeDisplay(currentNode, width),

		// Children list
		ChildrenList(currentNode.children, width, childrenHeight),

		// Sibling indicators
		SiblingIndicators(prevSibling, nextSibling, width),

		// Feedback message
		FeedbackMessage(state.feedbackMessage, width),

		// Key hints bar
		KeyHintsBar(width),
	];

	// Create root container
	const root = Box(
		{
			width: "100%",
			height: "100%",
			flexDirection: "column",
			backgroundColor: "#000000",
		},
		...mainContent,
	);

	// Clear and add main content
	// Remove all children from root using type assertion for OpenTUI internals
	const rootNode = renderer.root as unknown as { children: UIComponent[] };
	while (rootNode.children.length > 0) {
		const child = rootNode.children[0];
		if (child) renderer.root.remove(child);
	}
	renderer.root.add(root);

	// Add modal overlay if active
	if (state.modalState) {
		const modalWidth = Math.min(50, width - 4);
		const modal = createModal(
			state.modalState,
			currentNode.title,
			countDescendants(currentNode),
			modalWidth,
		);
		if (modal) {
			renderer.root.add(modal);
		}
	}
}

/**
 * Shows a temporary feedback message
 *
 * @param state - The application state
 * @param message - The message to show
 * @param onUpdate - Callback to trigger re-render
 * @param duration - How long to show the message (ms)
 */
export function showFeedback(
	state: AppState,
	message: string,
	onUpdate: () => void,
	duration = 1500,
): void {
	// Clear any existing timeout
	if (state.feedbackTimeout) {
		clearTimeout(state.feedbackTimeout);
	}

	state.feedbackMessage = message;
	onUpdate();

	state.feedbackTimeout = setTimeout(() => {
		state.feedbackMessage = null;
		state.feedbackTimeout = undefined;
		onUpdate();
	}, duration);
}
