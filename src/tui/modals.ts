/**
 * Modal components for new, edit, delete, and help dialogs
 */

import { Box, Text, TextAttributes } from "@opentui/core";
import type { ModalState } from "../data/types";
import { truncate } from "../utils/formatting";
import { Button, ErrorMessage, colors } from "./components";

// Use generic type for OpenTUI components since VNode types are complex
// biome-ignore lint/suspicious/noExplicitAny: OpenTUI VNode types are complex
type UIComponent = any;

/**
 * Creates the modal container wrapper
 */
function ModalContainer(
	title: string,
	width: number,
	height: number,
	children: UIComponent[],
): UIComponent {
	return Box(
		{
			position: "absolute",
			left: "50%",
			top: "50%",
			width,
			height,
			marginLeft: -Math.floor(width / 2),
			marginTop: -Math.floor(height / 2),
			backgroundColor: colors.modalBg,
			borderStyle: "single",
			borderColor: colors.modalBorder,
			flexDirection: "column",
		},
		// Title bar
		Box(
			{
				width: "100%",
				height: 1,
				paddingLeft: 1,
				borderStyle: "single",
				borderColor: colors.modalBorder,
			},
			Text({
				content: title,
				fg: colors.currentTitle,
				attributes: TextAttributes.BOLD,
			}),
		),
		// Content area
		Box(
			{
				flexGrow: 1,
				flexDirection: "column",
				padding: 1,
			},
			...children,
		),
	);
}

/**
 * Creates the New Sub-Problem modal
 */
export function NewModal(state: ModalState, width: number): UIComponent {
	const inputValue = state.inputValue || "";
	const selectedButton = state.selectedButton ?? 0;
	const errorMessage = state.errorMessage;

	return ModalContainer("Create New Sub-Problem", width, 12, [
		// Input label and field
		Text({
			content: "Title:",
			fg: colors.childrenText,
		}),
		Box(
			{
				width: "100%",
				height: 1,
				backgroundColor: "#333333",
				paddingLeft: 1,
				paddingRight: 1,
				marginTop: 1,
				marginBottom: 1,
			},
			Text({
				content: inputValue || "(type here)",
				fg: inputValue ? colors.currentTitle : colors.siblingHint,
			}),
		),
		// Error message
		errorMessage ? ErrorMessage(errorMessage) : Box({ height: 1 }),
		// Buttons
		Box(
			{
				width: "100%",
				flexDirection: "row",
				justifyContent: "center",
				gap: 2,
				marginTop: 1,
			},
			Button("Create", selectedButton === 0),
			Button("Cancel", selectedButton === 1),
		),
		// Key hints
		Box(
			{
				width: "100%",
				height: 1,
				marginTop: 1,
				borderStyle: "single",
				borderColor: colors.border,
				paddingLeft: 1,
			},
			Text({
				content: "Tab:next  Enter:create  Esc:cancel",
				fg: colors.keyHints,
			}),
		),
	]);
}

/**
 * Creates the Edit Problem modal
 */
export function EditModal(state: ModalState, currentTitle: string, width: number): UIComponent {
	const inputValue = state.inputValue ?? currentTitle;
	const selectedButton = state.selectedButton ?? 0;
	const errorMessage = state.errorMessage;

	return ModalContainer("Edit Problem", width, 12, [
		// Input label and field
		Text({
			content: "Title:",
			fg: colors.childrenText,
		}),
		Box(
			{
				width: "100%",
				height: 1,
				backgroundColor: "#333333",
				paddingLeft: 1,
				paddingRight: 1,
				marginTop: 1,
				marginBottom: 1,
			},
			Text({
				content: inputValue || "(type here)",
				fg: inputValue ? colors.currentTitle : colors.siblingHint,
			}),
		),
		// Error message
		errorMessage ? ErrorMessage(errorMessage) : Box({ height: 1 }),
		// Buttons
		Box(
			{
				width: "100%",
				flexDirection: "row",
				justifyContent: "center",
				gap: 2,
				marginTop: 1,
			},
			Button("Save", selectedButton === 0),
			Button("Cancel", selectedButton === 1),
		),
		// Key hints
		Box(
			{
				width: "100%",
				height: 1,
				marginTop: 1,
				borderStyle: "single",
				borderColor: colors.border,
				paddingLeft: 1,
			},
			Text({
				content: "Tab:next  Enter:save  Esc:cancel",
				fg: colors.keyHints,
			}),
		),
	]);
}

/**
 * Creates the Delete Confirmation modal
 */
export function DeleteModal(
	nodeTitle: string,
	childCount: number,
	selectedButton: number,
	width: number,
): UIComponent {
	const childText =
		childCount > 0
			? `This will delete this problem and ${childCount} ${childCount === 1 ? "child" : "children"} permanently.`
			: "This will delete this problem permanently.";

	return ModalContainer("Delete Problem?", width, 12, [
		// Problem title
		Text({
			content: `"${truncate(nodeTitle, width - 8)}"`,
			fg: colors.currentTitle,
		}),
		Box({ height: 1 }),
		// Warning text
		Text({
			content: childText,
			fg: colors.childrenText,
		}),
		Box({ height: 1 }),
		// Buttons
		Box(
			{
				width: "100%",
				flexDirection: "row",
				justifyContent: "center",
				gap: 2,
				marginTop: 1,
			},
			Button("Delete", selectedButton === 0),
			Button("Cancel", selectedButton === 1),
		),
		// Key hints
		Box(
			{
				width: "100%",
				height: 1,
				marginTop: 1,
				borderStyle: "single",
				borderColor: colors.border,
				paddingLeft: 1,
			},
			Text({
				content: "Enter:confirm  Esc:cancel",
				fg: colors.keyHints,
			}),
		),
	]);
}

/**
 * Creates the Help modal
 */
export function HelpModal(width: number): UIComponent {
	const keyBindings = [
		["↑/k", "Previous sibling"],
		["↓/j", "Next sibling"],
		["→/l", "Dive into first child"],
		["←/h", "Go back to parent"],
		["n", "Create new child"],
		["e", "Edit current node"],
		["d", "Toggle done status"],
		["x", "Delete current node"],
		["r", "Refresh display"],
		["?", "Show this help"],
		["q", "Quit"],
	];

	const helpLines = keyBindings.map(([key, desc]) =>
		Text({
			content: `  ${key.padEnd(6)} ${desc}`,
			fg: colors.childrenText,
		}),
	);

	return ModalContainer("Key Bindings", width, 18, [
		...helpLines,
		Box({ height: 1 }),
		Box(
			{
				width: "100%",
				height: 1,
				borderStyle: "single",
				borderColor: colors.border,
				paddingLeft: 1,
			},
			Text({
				content: "Press any key to close",
				fg: colors.keyHints,
			}),
		),
	]);
}

/**
 * Creates the appropriate modal based on state
 */
export function createModal(
	modalState: ModalState,
	currentNodeTitle: string,
	childCount: number,
	width: number,
): UIComponent | null {
	switch (modalState.type) {
		case "new":
			return NewModal(modalState, width);
		case "edit":
			return EditModal(modalState, currentNodeTitle, width);
		case "delete":
			return DeleteModal(currentNodeTitle, childCount, modalState.selectedButton ?? 0, width);
		case "help":
			return HelpModal(width);
		default:
			return null;
	}
}
