/**
 * Main OpenTUI application
 *
 * Uses a list-based navigation model where:
 * - Root is not selectable, we view its children
 * - Up/down moves selection within list
 * - Right/Enter dives into selected item
 * - Left goes back to parent
 */

import { writeSync } from "node:fs";
import {
	BoxRenderable,
	type CliRenderer,
	type KeyEvent,
	TextAttributes,
	TextRenderable,
	createCliRenderer,
} from "@opentui/core";
import {
	addChildNode,
	countDescendants,
	deleteNode,
	editNodeTitle,
	findNode,
	toggleNodeStatus,
} from "../data/operations";
import { saveProject } from "../data/storage";
import type { AppState, ModalState, Node, Project } from "../data/types";
import { truncate } from "../utils/formatting";
import { validateTitle } from "../utils/validation";
import {
	adjustSelectionAfterDelete,
	diveIn,
	ensureValidSelection,
	getBreadcrumbPath,
	getCurrentList,
	getCurrentParent,
	getSelectedNode,
	goBack,
	initializeNavigation,
	moveDown,
	moveUp,
} from "./navigation";

/** Color palette */
const colors = {
	breadcrumbs: "#888888",
	itemDone: "#FFFFFF",
	itemOpen: "#888888",
	itemSelected: "#FFFFFF",
	keyHints: "#666666",
	border: "#666666",
	feedback: "#FFAA00",
	modalBg: "#1a1a1a",
	error: "#FF4444",
} as const;

/**
 * Sanitizes a single input character
 * Only allows: a-z, A-Z (converted to lowercase), 0-9, space, hyphen, underscore
 * Returns the sanitized character or null if invalid
 */
function sanitizeInputChar(char: string): string | null {
	// Allow letters (convert to lowercase)
	if (/^[a-zA-Z]$/.test(char)) {
		return char.toLowerCase();
	}
	// Allow numbers, space, hyphen, underscore
	if (/^[0-9 _-]$/.test(char)) {
		return char;
	}
	// Invalid character
	return null;
}

/**
 * Main application class using list-based navigation
 */
export class TUIApp {
	private renderer: CliRenderer;
	private state: AppState;
	private isRunning = false;

	// UI elements
	private mainContainer!: BoxRenderable;
	private breadcrumbText!: TextRenderable;
	private listText!: TextRenderable;
	private feedbackText!: TextRenderable;
	private hintsText!: TextRenderable;
	private modalContainer!: BoxRenderable | null;

	constructor(renderer: CliRenderer, project: Project) {
		this.renderer = renderer;
		this.state = {
			project,
			navigationStack: [],
			selectedIndex: 0,
			modalState: null,
			feedbackMessage: null,
		};

		initializeNavigation(this.state);
		this.setupUI();
	}

	/**
	 * Sets up the UI components
	 */
	private setupUI(): void {
		const height = process.stdout.rows || 24;

		// Main container
		this.mainContainer = new BoxRenderable(this.renderer, {
			id: "main",
			width: "100%",
			height: "100%",
			flexDirection: "column",
		});

		// Breadcrumb
		this.breadcrumbText = new TextRenderable(this.renderer, {
			id: "breadcrumb",
			content: "",
			fg: colors.breadcrumbs,
			position: "absolute",
			left: 1,
			top: 0,
		});

		// Main list
		this.listText = new TextRenderable(this.renderer, {
			id: "list",
			content: "",
			fg: colors.itemOpen,
			position: "absolute",
			left: 1,
			top: 2,
		});

		// Feedback message
		this.feedbackText = new TextRenderable(this.renderer, {
			id: "feedback",
			content: "",
			fg: colors.feedback,
			attributes: TextAttributes.BOLD,
			position: "absolute",
			left: 2,
			top: height - 3,
		});

		// Key hints
		this.hintsText = new TextRenderable(this.renderer, {
			id: "hints",
			content: "↑↓ select  →/space enter  ← back  n new  e edit  d done  x del  q quit",
			fg: colors.keyHints,
			position: "absolute",
			left: 1,
			top: height - 1,
		});

		// Add all to root
		this.renderer.root.add(this.mainContainer);
		this.renderer.root.add(this.breadcrumbText);
		this.renderer.root.add(this.listText);
		this.renderer.root.add(this.feedbackText);
		this.renderer.root.add(this.hintsText);

		this.modalContainer = null;
	}

	/**
	 * Starts the TUI application
	 */
	async start(): Promise<void> {
		this.isRunning = true;

		// Set up keyboard handler
		this.renderer.keyInput.on("keypress", this.handleKeyPress.bind(this));

		// Initial render
		this.updateDisplay();

		// Wait for quit
		return new Promise((resolve) => {
			const checkRunning = setInterval(() => {
				if (!this.isRunning) {
					clearInterval(checkRunning);
					resolve();
				}
			}, 100);
		});
	}

	/**
	 * Updates the display content
	 */
	private updateDisplay(): void {
		const width = process.stdout.columns || 80;

		// Ensure selection is valid
		ensureValidSelection(this.state);

		// Update breadcrumb
		this.breadcrumbText.content = this.formatBreadcrumb(width);

		// Update list
		this.listText.content = this.formatList(width);

		// Update feedback
		this.feedbackText.content = this.state.feedbackMessage || "";

		// Handle modal if open
		this.updateModal();
	}

	/**
	 * Formats the breadcrumb path
	 */
	private formatBreadcrumb(width: number): string {
		const path = getBreadcrumbPath(this.state);

		if (path.length === 0) {
			return truncate(this.state.project.project_name, width - 2);
		}

		const segments = path.map((n) => truncate(n.title, 20));
		let breadcrumb = segments.join(" > ");

		if (breadcrumb.length > width - 2) {
			// Truncate from start
			while (segments.length > 1 && breadcrumb.length > width - 8) {
				segments.shift();
				breadcrumb = `... > ${segments.join(" > ")}`;
			}
		}

		return breadcrumb;
	}

	/**
	 * Checks if all descendants of a node are done
	 */
	private allDescendantsDone(node: Node): boolean {
		for (const child of node.children) {
			if (child.status !== "done") return false;
			if (!this.allDescendantsDone(child)) return false;
		}
		return true;
	}

	/**
	 * Gets the status display for a task
	 */
	private getStatusDisplay(item: Node): string {
		if (item.status !== "done") {
			return "";
		}

		// Task is done
		if (item.children.length === 0) {
			// No children - just done
			return " (done)";
		}

		// Has children - check if all are done
		if (this.allDescendantsDone(item)) {
			return " (done)";
		}

		// Some children not done
		return " (done, partial)";
	}

	/**
	 * Gets the child count display for a task
	 */
	private getChildCountDisplay(item: Node): string {
		const count = countDescendants(item);
		if (count === 0) return "";
		return ` [${count}]`;
	}

	/**
	 * Formats the list with selection indicator
	 * Uses plain text only - no ANSI escape codes
	 */
	private formatList(width: number): string {
		const list = getCurrentList(this.state);

		if (list.length === 0) {
			return "No items. Press 'n' to create one.";
		}

		const lines: string[] = [];
		const maxShow = Math.min(list.length, (process.stdout.rows || 24) - 6);

		// Calculate scroll offset to keep selection visible
		let startIdx = 0;
		if (this.state.selectedIndex >= maxShow) {
			startIdx = this.state.selectedIndex - maxShow + 1;
		}

		for (let i = startIdx; i < Math.min(list.length, startIdx + maxShow); i++) {
			const item = list[i];
			const isSelected = i === this.state.selectedIndex;
			const prefix = isSelected ? ">" : " ";
			const status = this.getStatusDisplay(item);
			const childCount = this.getChildCountDisplay(item);
			const title = truncate(item.title, width - 25);

			lines.push(`${prefix} ${title}${childCount}${status}`);
		}

		if (list.length > maxShow) {
			const remaining = list.length - startIdx - maxShow;
			if (remaining > 0) {
				lines.push(`  +${remaining} more`);
			}
		}

		return lines.join("\n");
	}

	/**
	 * Updates modal display
	 */
	private updateModal(): void {
		// Remove existing modal if any
		if (this.modalContainer) {
			this.renderer.root.remove("modal");
			this.modalContainer = null;
		}

		if (!this.state.modalState) return;

		const width = Math.min(50, (process.stdout.columns || 80) - 4);
		const modal = this.state.modalState;

		let title = "";
		let content = "";
		let buttons = "";
		let hints = "";

		switch (modal.type) {
			case "new":
				title = "New Task";
				content = `Title: ${modal.inputValue || "(type here)"}\n${modal.errorMessage || ""}`;
				buttons = modal.selectedButton === 0 ? "[Create]  Cancel" : " Create  [Cancel]";
				hints = "Tab:switch  Enter:confirm  Esc:cancel";
				break;
			case "edit":
				title = "Edit Task";
				content = `Title: ${modal.inputValue || "(type here)"}\n${modal.errorMessage || ""}`;
				buttons = modal.selectedButton === 0 ? "[Save]  Cancel" : " Save  [Cancel]";
				hints = "Tab:switch  Enter:confirm  Esc:cancel";
				break;
			case "delete": {
				const selected = getSelectedNode(this.state);
				if (!selected) break;
				const childCount = countDescendants(selected);
				title = "Delete Task?";
				content = `"${truncate(selected.title, width - 4)}"\n`;
				content +=
					childCount > 0
						? `This will delete ${childCount} sub-tasks.`
						: "This will delete this task.";
				buttons = modal.selectedButton === 0 ? "[Delete]  Cancel" : " Delete  [Cancel]";
				hints = "Tab:switch buttons  Enter:confirm  Esc:cancel";
				break;
			}
			case "help":
				title = "Key Bindings";
				content = [
					"↑/k    Move up",
					"↓/j    Move down",
					"→/l    Enter / dive in",
					"←/h    Back / go up",
					"Enter  Enter selected",
					"n      New task",
					"e      Edit selected",
					"d      Toggle done",
					"x      Delete selected",
					"q      Quit",
				].join("\n");
				buttons = "";
				hints = "Press any key to close";
				break;
		}

		const modalHeight = modal.type === "help" ? 15 : 10;
		const left = Math.floor(((process.stdout.columns || 80) - width) / 2);
		const top = Math.floor(((process.stdout.rows || 24) - modalHeight) / 2);

		this.modalContainer = new BoxRenderable(this.renderer, {
			id: "modal",
			width,
			height: modalHeight,
			position: "absolute",
			left,
			top,
			backgroundColor: colors.modalBg,
			borderStyle: "single",
			borderColor: colors.border,
			title,
			titleAlignment: "left",
			padding: 1,
		});

		const modalContent = new TextRenderable(this.renderer, {
			id: "modal-content",
			content: `${content}\n\n${buttons}\n\n${hints}`,
			fg: "#FFFFFF",
		});

		this.modalContainer.add(modalContent);
		this.renderer.root.add(this.modalContainer);
	}

	/**
	 * Handles key press events
	 */
	private handleKeyPress(key: KeyEvent): void {
		if (this.state.modalState) {
			this.handleModalKeyPress(key);
		} else {
			this.handleNavigationKeyPress(key);
		}
	}

	/**
	 * Handles key presses in navigation mode
	 */
	private handleNavigationKeyPress(key: KeyEvent): void {
		const keyName = key.name?.toLowerCase() || key.sequence;

		switch (keyName) {
			case "up":
			case "k":
				this.handleNavigation(moveUp(this.state));
				break;

			case "down":
			case "j":
				this.handleNavigation(moveDown(this.state));
				break;

			case "right":
			case "l":
			case "return":
			case "enter":
			case "space":
				this.handleNavigation(diveIn(this.state));
				break;

			case "left":
			case "h":
				this.handleNavigation(goBack(this.state));
				break;

			case "n":
				this.openModal("new");
				break;

			case "e":
				this.openEditModal();
				break;

			case "d":
				this.toggleDone();
				break;

			case "x":
				this.openDeleteModal();
				break;

			case "?":
				this.openModal("help");
				break;

			case "r":
				this.updateDisplay();
				break;

			case "q":
				this.quit();
				break;
		}
	}

	/**
	 * Handles navigation result
	 */
	private handleNavigation(result: { success: boolean; feedbackMessage?: string }): void {
		if (!result.success && result.feedbackMessage) {
			this.showFeedback(result.feedbackMessage);
		}
		this.updateDisplay();
	}

	/**
	 * Opens a modal
	 */
	private openModal(type: ModalState["type"]): void {
		this.state.modalState = {
			type,
			inputValue: "",
			selectedButton: 0,
		};
		this.updateDisplay();
	}

	/**
	 * Opens the edit modal with current title
	 */
	private openEditModal(): void {
		const selected = getSelectedNode(this.state);
		if (!selected) {
			this.showFeedback("Nothing selected");
			return;
		}

		this.state.modalState = {
			type: "edit",
			inputValue: selected.title,
			selectedButton: 0,
		};
		this.updateDisplay();
	}

	/**
	 * Opens the delete confirmation modal
	 */
	private openDeleteModal(): void {
		const selected = getSelectedNode(this.state);
		if (!selected) {
			this.showFeedback("Nothing selected");
			return;
		}

		this.state.modalState = {
			type: "delete",
			selectedButton: 1,
		};
		this.updateDisplay();
	}

	/**
	 * Closes the current modal
	 */
	private closeModal(): void {
		this.state.modalState = null;
		this.updateDisplay();
	}

	/**
	 * Handles key presses in modal mode
	 */
	private handleModalKeyPress(key: KeyEvent): void {
		if (!this.state.modalState) return;

		const modal = this.state.modalState;
		const keyName = key.name?.toLowerCase() || key.sequence;

		if (modal.type === "help") {
			this.closeModal();
			return;
		}

		switch (keyName) {
			case "escape":
				this.closeModal();
				break;

			case "tab":
				modal.selectedButton = modal.selectedButton === 0 ? 1 : 0;
				this.updateDisplay();
				break;

			case "return":
			case "enter":
				this.handleModalSubmit();
				break;

			case "backspace":
			case "delete":
				if (modal.type === "new" || modal.type === "edit") {
					modal.inputValue = (modal.inputValue || "").slice(0, -1);
					modal.errorMessage = undefined;
					this.updateDisplay();
				}
				break;

			default:
				if ((modal.type === "new" || modal.type === "edit") && key.sequence) {
					if (key.sequence.length === 1 && key.sequence.charCodeAt(0) >= 32) {
						const char = key.sequence;
						const sanitized = sanitizeInputChar(char);

						if (sanitized) {
							modal.inputValue = (modal.inputValue || "") + sanitized;
							modal.errorMessage = undefined;
						} else {
							modal.errorMessage = "Only letters, numbers, spaces, - and _ allowed";
						}
						this.updateDisplay();
					}
				}
				break;
		}
	}

	/**
	 * Handles modal form submission
	 */
	private handleModalSubmit(): void {
		if (!this.state.modalState) return;

		const modal = this.state.modalState;

		if (modal.selectedButton === 1) {
			this.closeModal();
			return;
		}

		switch (modal.type) {
			case "new":
				this.submitNewNode();
				break;
			case "edit":
				this.submitEditNode();
				break;
			case "delete":
				this.submitDelete();
				break;
		}
	}

	/**
	 * Gets the parent node where new items should be added
	 */
	private getParentForNewItem(): Node {
		const parent = getCurrentParent(this.state);
		return parent || this.state.project.root;
	}

	private async submitNewNode(): Promise<void> {
		if (!this.state.modalState) return;

		const title = this.state.modalState.inputValue || "";
		const validation = validateTitle(title);

		if (!validation.isValid) {
			this.state.modalState.errorMessage = validation.error;
			this.updateDisplay();
			return;
		}

		const parent = this.getParentForNewItem();
		addChildNode(parent, title);

		await this.save();
		ensureValidSelection(this.state);
		this.closeModal();
		this.showFeedback("Created task");
	}

	private async submitEditNode(): Promise<void> {
		if (!this.state.modalState) return;

		const title = this.state.modalState.inputValue || "";
		const validation = validateTitle(title);

		if (!validation.isValid) {
			this.state.modalState.errorMessage = validation.error;
			this.updateDisplay();
			return;
		}

		const selected = getSelectedNode(this.state);
		if (!selected) {
			this.closeModal();
			return;
		}

		editNodeTitle(selected, title);

		await this.save();
		this.closeModal();
		this.showFeedback("Updated");
	}

	private async submitDelete(): Promise<void> {
		const selected = getSelectedNode(this.state);
		if (!selected) {
			this.closeModal();
			return;
		}

		const parent = this.getParentForNewItem();
		const deletedIndex = this.state.selectedIndex;

		deleteNode(parent, selected.id);
		adjustSelectionAfterDelete(this.state, deletedIndex);

		await this.save();
		this.closeModal();
		this.showFeedback("Deleted");
	}

	private async toggleDone(): Promise<void> {
		const selected = getSelectedNode(this.state);
		if (!selected) {
			this.showFeedback("Nothing selected");
			return;
		}

		const wasDone = selected.status === "done";
		toggleNodeStatus(selected);
		await this.save();

		const message = wasDone ? "Marked open" : "Done";
		this.showFeedback(message);
		this.updateDisplay();
	}

	private showFeedback(message: string): void {
		this.state.feedbackMessage = message;
		this.updateDisplay();

		setTimeout(() => {
			if (this.state.feedbackMessage === message) {
				this.state.feedbackMessage = null;
				this.updateDisplay();
			}
		}, 1500);
	}

	private async save(): Promise<void> {
		try {
			await saveProject(this.state.project);
		} catch {
			this.showFeedback("Failed to save");
		}
	}

	private async quit(): Promise<void> {
		await this.save();

		try {
			this.renderer.stop();
		} catch {
			// Ignore errors during stop
		}

		restoreTerminal();
		this.isRunning = false;
	}
}

/**
 * Restores the terminal to its original state
 */
function restoreTerminal(): void {
	try {
		if (process.stdin.isTTY && process.stdin.isRaw) {
			process.stdin.setRawMode(false);
		}
	} catch {
		// Ignore errors
	}

	const sequences = [
		"\x1B[?1049l",
		"\x1B[?25h",
		"\x1B[0m",
		"\x1B[?1000l",
		"\x1B[?1002l",
		"\x1B[?1003l",
		"\x1B[?1006l",
		"\x1B[2J",
		"\x1B[H",
		"\x1B[?25h",
	].join("");

	try {
		writeSync(1, sequences);
	} catch {
		process.stdout.write(sequences);
	}
}

/**
 * Disables mouse tracking
 */
function disableMouseTracking(): void {
	const sequences = [
		"\x1B[?1000l",
		"\x1B[?1002l",
		"\x1B[?1003l",
		"\x1B[?1006l",
		"\x1B[?1015l",
	].join("");
	process.stdout.write(sequences);
}

/**
 * Creates and starts the TUI application
 */
export async function startTUI(project: Project): Promise<void> {
	disableMouseTracking();

	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
	});

	disableMouseTracking();

	const cleanup = () => {
		try {
			renderer.stop();
		} catch {
			// Ignore
		}
		restoreTerminal();
		process.exit(0);
	};

	process.on("SIGINT", cleanup);
	process.on("SIGTERM", cleanup);
	process.on("exit", () => {
		restoreTerminal();
	});

	const app = new TUIApp(renderer, project);

	try {
		await app.start();
	} finally {
		restoreTerminal();
	}
}
