/**
 * Reusable UI components for the TUI
 */

import { Box, Text, TextAttributes } from "@opentui/core";
import type { Node } from "../data/types";

// Use generic type for OpenTUI components since VNode types are complex
// biome-ignore lint/suspicious/noExplicitAny: OpenTUI VNode types are complex
type UIComponent = any;
import {
	formatBreadcrumbs,
	formatCheckbox,
	formatStatusBadge,
	truncate,
} from "../utils/formatting";

/** Color palette */
export const colors = {
	breadcrumbs: "#888888",
	currentTitle: "#FFFFFF",
	statusOpen: "#FFFFFF",
	statusDone: "#00FF00",
	childrenText: "#CCCCCC",
	siblingHint: "#888888",
	keyHints: "#888888",
	border: "#666666",
	feedback: "#FFAA00",
	modalBg: "#1a1a1a",
	modalBorder: "#444444",
	error: "#FF4444",
	buttonSelected: "#4444FF",
	buttonNormal: "#333333",
} as const;

/**
 * Creates the breadcrumb bar component
 */
export function BreadcrumbBar(path: Node[], projectName: string, width: number): UIComponent {
	const breadcrumbs = formatBreadcrumbs(path, projectName);

	return Box(
		{
			width,
			height: 1,
			paddingLeft: 1,
			paddingRight: 1,
		},
		Text({
			content: truncate(breadcrumbs, width - 2),
			fg: colors.breadcrumbs,
		}),
	);
}

/**
 * Creates the current node display component
 */
export function CurrentNodeDisplay(node: Node, width: number): UIComponent {
	const statusColor = node.status === "done" ? colors.statusDone : colors.statusOpen;
	const badge = formatStatusBadge(node.status);

	return Box(
		{
			width,
			flexDirection: "column",
			paddingLeft: 2,
			paddingRight: 2,
			paddingTop: 1,
			paddingBottom: 1,
		},
		Text({
			content: `${badge} ${node.title}`,
			fg: statusColor,
			attributes: TextAttributes.BOLD,
		}),
	);
}

/**
 * Creates the children list component
 */
export function ChildrenList(children: Node[], width: number, maxHeight: number): UIComponent {
	if (children.length === 0) {
		return Box(
			{
				width,
				paddingLeft: 2,
				paddingRight: 2,
				flexDirection: "column",
			},
			Text({
				content: "Children:",
				fg: colors.childrenText,
				attributes: TextAttributes.DIM,
			}),
			Text({
				content: "  No sub-problems yet. Press 'n' to add one.",
				fg: colors.childrenText,
				attributes: TextAttributes.DIM,
			}),
		);
	}

	const displayCount = Math.min(children.length, maxHeight - 1);
	const childItems: UIComponent[] = [
		Text({
			content: `Children (${children.length}):`,
			fg: colors.childrenText,
		}),
	];

	for (let i = 0; i < displayCount; i++) {
		const child = children[i];
		const checkbox = formatCheckbox(child.status);
		const color = child.status === "done" ? colors.siblingHint : colors.childrenText;
		const title = truncate(child.title, width - 10);

		childItems.push(
			Text({
				content: `  • ${checkbox} ${title}`,
				fg: color,
				attributes: child.status === "done" ? TextAttributes.DIM : 0,
			}),
		);
	}

	if (children.length > displayCount) {
		childItems.push(
			Text({
				content: `  ... and ${children.length - displayCount} more`,
				fg: colors.siblingHint,
				attributes: TextAttributes.DIM,
			}),
		);
	}

	return Box(
		{
			width,
			paddingLeft: 2,
			paddingRight: 2,
			flexDirection: "column",
		},
		...childItems,
	);
}

/**
 * Creates the sibling indicators component
 */
export function SiblingIndicators(
	prevSibling: Node | null,
	nextSibling: Node | null,
	width: number,
): UIComponent {
	const items: UIComponent[] = [];

	if (prevSibling) {
		items.push(
			Text({
				content: `↑ ${truncate(prevSibling.title, width - 6)}`,
				fg: colors.siblingHint,
				attributes: TextAttributes.DIM,
			}),
		);
	}

	if (nextSibling) {
		items.push(
			Text({
				content: `↓ ${truncate(nextSibling.title, width - 6)}`,
				fg: colors.siblingHint,
				attributes: TextAttributes.DIM,
			}),
		);
	}

	if (items.length === 0) {
		return Box({ width, height: 0 });
	}

	return Box(
		{
			width,
			paddingLeft: 2,
			paddingRight: 2,
			paddingTop: 1,
			flexDirection: "column",
		},
		...items,
	);
}

/**
 * Creates the key hints bar component
 */
export function KeyHintsBar(width: number): UIComponent {
	return Box(
		{
			width,
			height: 1,
			paddingLeft: 1,
			paddingRight: 1,
			borderStyle: "single",
			borderColor: colors.border,
		},
		Text({
			content: "↑↓:siblings →:dive ←:back n:new e:edit d:done x:del ?:help q:quit",
			fg: colors.keyHints,
		}),
	);
}

/**
 * Creates the feedback message component
 */
export function FeedbackMessage(message: string | null, width: number): UIComponent {
	if (!message) {
		return Box({ width, height: 0 });
	}

	return Box(
		{
			width,
			height: 1,
			paddingLeft: 1,
			justifyContent: "center",
		},
		Text({
			content: message,
			fg: colors.feedback,
			attributes: TextAttributes.BOLD,
		}),
	);
}

/**
 * Creates a button component
 */
export function Button(label: string, selected: boolean): UIComponent {
	const bgColor = selected ? colors.buttonSelected : colors.buttonNormal;

	return Box(
		{
			paddingLeft: 2,
			paddingRight: 2,
			backgroundColor: bgColor,
		},
		Text({
			content: label,
			fg: colors.currentTitle,
		}),
	);
}

/**
 * Creates an error message component
 */
export function ErrorMessage(message: string): UIComponent {
	return Text({
		content: message,
		fg: colors.error,
	});
}
