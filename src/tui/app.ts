/**
 * Main OpenTUI application
 *
 * Uses OpenTUI's automatic re-rendering when the renderable tree changes,
 * rather than the live mode render loop.
 */

import {
	Box,
	BoxRenderable,
	type CliRenderer,
	type KeyEvent,
	Text,
	TextAttributes,
	TextRenderable,
	createCliRenderer,
} from "@opentui/core";
import {
	addChildNode,
	countDescendants,
	deleteNode,
	editNodeTitle,
	findParent,
	getNextSibling,
	getPreviousSibling,
	getSiblingIndex,
	toggleNodeStatus,
} from "../data/operations";
import { saveProject } from "../data/storage";
import type { AppState, ModalState, Node, Project } from "../data/types";
import {
	formatBreadcrumbs,
	formatCheckbox,
	formatStatusBadge,
	truncate,
} from "../utils/formatting";
import { validateTitle } from "../utils/validation";
import {
	diveIntoChild,
	getCurrentNode,
	getNodePathFromState,
	getParentNode,
	getSiblingsFromState,
	goToParent,
	handlePostDeleteNavigation,
	initializeNavigation,
	moveToNextSibling,
	moveToPreviousSibling,
} from "./navigation";

/** Color palette */
const colors = {
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
	error: "#FF4444",
} as const;

/**
 * Main application class using raw Renderables for better control
 */
export class TUIApp {
	private renderer: CliRenderer;
	private state: AppState;
	private isRunning = false;

	// UI elements using raw renderables
	private mainContainer!: BoxRenderable;
	private breadcrumbText!: TextRenderable;
	private statusText!: TextRenderable;
	private childrenText!: TextRenderable;
	private siblingsText!: TextRenderable;
	private feedbackText!: TextRenderable;
	private hintsText!: TextRenderable;
	private modalContainer!: BoxRenderable | null;

	constructor(renderer: CliRenderer, project: Project) {
		this.renderer = renderer;
		this.state = {
			project,
			navigationStack: [project.root.id],
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
		const width = process.stdout.columns || 80;
		const height = process.stdout.rows || 24;

		// Main container
		this.mainContainer = new BoxRenderable(this.renderer, {
			id: "main",
			width: "100%",
			height: "100%",
			flexDirection: "column",
			backgroundColor: "#000000",
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

		// Current node status
		this.statusText = new TextRenderable(this.renderer, {
			id: "status",
			content: "",
			fg: colors.currentTitle,
			attributes: TextAttributes.BOLD,
			position: "absolute",
			left: 2,
			top: 2,
		});

		// Children list
		this.childrenText = new TextRenderable(this.renderer, {
			id: "children",
			content: "",
			fg: colors.childrenText,
			position: "absolute",
			left: 2,
			top: 4,
		});

		// Sibling indicators
		this.siblingsText = new TextRenderable(this.renderer, {
			id: "siblings",
			content: "",
			fg: colors.siblingHint,
			attributes: TextAttributes.DIM,
			position: "absolute",
			left: 2,
			top: height - 5,
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
			content: "↑↓:siblings →:dive ←:back n:new e:edit d:done x:del ?:help q:quit",
			fg: colors.keyHints,
			position: "absolute",
			left: 1,
			top: height - 1,
		});

		// Add all to root
		this.renderer.root.add(this.mainContainer);
		this.renderer.root.add(this.breadcrumbText);
		this.renderer.root.add(this.statusText);
		this.renderer.root.add(this.childrenText);
		this.renderer.root.add(this.siblingsText);
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

		// Wait for quit (OpenTUI handles rendering automatically when tree changes)
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
		const height = process.stdout.rows || 24;

		// Get current state
		const currentNode = getCurrentNode(this.state);
		const nodePath = getNodePathFromState(this.state);
		const siblings = getSiblingsFromState(this.state);

		// Update breadcrumb
		const breadcrumbs = formatBreadcrumbs(nodePath, this.state.project.project_name);
		this.breadcrumbText.content = truncate(breadcrumbs, width - 2);

		// Update current node status
		const badge = formatStatusBadge(currentNode.status);
		const statusColor = currentNode.status === "done" ? colors.statusDone : colors.statusOpen;
		this.statusText.content = `${badge} ${truncate(currentNode.title, width - 10)}`;
		this.statusText.fg = statusColor;

		// Update children list
		this.childrenText.content = this.formatChildrenList(currentNode.children, width);

		// Update sibling indicators
		const prevSibling = getPreviousSibling(siblings, currentNode.id);
		const nextSibling = getNextSibling(siblings, currentNode.id);
		this.siblingsText.content = this.formatSiblingIndicators(prevSibling, nextSibling, width);

		// Update feedback
		this.feedbackText.content = this.state.feedbackMessage || "";

		// Handle modal if open
		this.updateModal();
	}

	/**
	 * Formats the children list
	 */
	private formatChildrenList(children: Node[], width: number): string {
		if (children.length === 0) {
			return "Children:\n  No sub-problems yet. Press 'n' to add one.";
		}

		const lines = [`Children (${children.length}):`];
		const maxShow = 8;

		for (let i = 0; i < Math.min(children.length, maxShow); i++) {
			const child = children[i];
			const checkbox = formatCheckbox(child.status);
			const title = truncate(child.title, width - 12);
			lines.push(`  • ${checkbox} ${title}`);
		}

		if (children.length > maxShow) {
			lines.push(`  ... and ${children.length - maxShow} more`);
		}

		return lines.join("\n");
	}

	/**
	 * Formats sibling indicators
	 */
	private formatSiblingIndicators(prev: Node | null, next: Node | null, width: number): string {
		const lines: string[] = [];
		if (prev) {
			lines.push(`↑ ${truncate(prev.title, width - 6)}`);
		}
		if (next) {
			lines.push(`↓ ${truncate(next.title, width - 6)}`);
		}
		return lines.join("\n");
	}

	/**
	 * Updates modal display
	 */
	private updateModal(): void {
		// Remove existing modal if any
		if (this.modalContainer) {
			// Remove by id
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
				title = "Create New Sub-Problem";
				content = `Title: ${modal.inputValue || "(type here)"}\n${modal.errorMessage || ""}`;
				buttons = modal.selectedButton === 0 ? "[Create]  Cancel" : " Create  [Cancel]";
				hints = "Tab:switch  Enter:confirm  Esc:cancel";
				break;
			case "edit":
				title = "Edit Problem";
				content = `Title: ${modal.inputValue || "(type here)"}\n${modal.errorMessage || ""}`;
				buttons = modal.selectedButton === 0 ? "[Save]  Cancel" : " Save  [Cancel]";
				hints = "Tab:switch  Enter:confirm  Esc:cancel";
				break;
			case "delete": {
				const currentNode = getCurrentNode(this.state);
				const childCount = countDescendants(currentNode);
				title = "Delete Problem?";
				content = `"${truncate(currentNode.title, width - 4)}"\n\n`;
				content +=
					childCount > 0
						? `This will delete ${childCount} children permanently.`
						: "This will delete this problem permanently.";
				buttons = modal.selectedButton === 0 ? "[Delete]  Cancel" : " Delete  [Cancel]";
				hints = "Enter:confirm  Esc:cancel";
				break;
			}
			case "help":
				title = "Key Bindings";
				content = [
					"↑/k    Previous sibling",
					"↓/j    Next sibling",
					"→/l    Dive into child",
					"←/h    Go to parent",
					"n      New child",
					"e      Edit title",
					"d      Toggle done",
					"x      Delete",
					"q      Quit",
				].join("\n");
				buttons = "";
				hints = "Press any key to close";
				break;
		}

		// Create modal box using raw renderable
		const modalHeight = modal.type === "help" ? 14 : 10;
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
			fg: colors.currentTitle,
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
				this.handleNavigation(moveToPreviousSibling(this.state));
				break;

			case "down":
			case "j":
				this.handleNavigation(moveToNextSibling(this.state));
				break;

			case "right":
			case "l":
				this.handleNavigation(diveIntoChild(this.state));
				break;

			case "left":
			case "h":
				this.handleNavigation(goToParent(this.state));
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
		const currentNode = getCurrentNode(this.state);
		this.state.modalState = {
			type: "edit",
			inputValue: currentNode.title,
			selectedButton: 0,
		};
		this.updateDisplay();
	}

	/**
	 * Opens the delete confirmation modal
	 */
	private openDeleteModal(): void {
		if (this.state.navigationStack.length === 1) {
			this.showFeedback("Cannot delete root problem");
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
						modal.inputValue = (modal.inputValue || "") + key.sequence;
						modal.errorMessage = undefined;
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

	private async submitNewNode(): Promise<void> {
		if (!this.state.modalState) return;

		const title = this.state.modalState.inputValue || "";
		const validation = validateTitle(title);

		if (!validation.isValid) {
			this.state.modalState.errorMessage = validation.error;
			this.updateDisplay();
			return;
		}

		const currentNode = getCurrentNode(this.state);
		const newNode = addChildNode(currentNode, title);

		await this.save();
		this.state.navigationStack.push(newNode.id);
		this.closeModal();
		this.showFeedback("Created sub-problem");
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

		const currentNode = getCurrentNode(this.state);
		editNodeTitle(currentNode, title);

		await this.save();
		this.closeModal();
		this.showFeedback("Updated title");
	}

	private async submitDelete(): Promise<void> {
		const currentNode = getCurrentNode(this.state);
		const parent = findParent(this.state.project.root, currentNode.id);

		if (!parent) {
			this.showFeedback("Cannot delete root problem");
			this.closeModal();
			return;
		}

		const siblings = parent.children;
		const siblingIndex = getSiblingIndex(siblings, currentNode.id);

		deleteNode(parent, currentNode.id);
		handlePostDeleteNavigation(this.state, currentNode.id, siblings, siblingIndex);

		await this.save();
		this.closeModal();
		this.showFeedback("Deleted problem");
	}

	private async toggleDone(): Promise<void> {
		const currentNode = getCurrentNode(this.state);
		const wasDone = currentNode.status === "done";

		toggleNodeStatus(currentNode);
		await this.save();

		const message = wasDone ? "Marked as open" : "Marked as done";
		this.showFeedback(message);
	}

	private showFeedback(message: string): void {
		this.state.feedbackMessage = message;
		this.updateDisplay();

		// Clear feedback after delay
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
		this.renderer.stop();
		this.isRunning = false;
	}
}

/**
 * Creates and starts the TUI application
 */
export async function startTUI(project: Project): Promise<void> {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
	});

	const app = new TUIApp(renderer, project);

	// Don't use renderer.start() - OpenTUI auto-renders on tree changes
	// This prevents the "weird numbers" issue
	await app.start();
}
