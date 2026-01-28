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
import type { AppState, ModalState, Node, Project, ViewMode } from "../data/types";
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

export class TUIApp {
	private renderer: CliRenderer;
	private state: AppState;
	private isRunning = false;
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
			viewMode: "zen",
			modalState: null,
			feedbackMessage: null,
		};

		initializeNavigation(this.state);
		this.setupUI();
	}

	private setupUI(): void {
		const height = process.stdout.rows || 24;

		this.mainContainer = new BoxRenderable(this.renderer, {
			id: "main",
			width: "100%",
			height: "100%",
			flexDirection: "column",
		});

		this.breadcrumbText = new TextRenderable(this.renderer, {
			id: "breadcrumb",
			content: "",
			fg: colors.breadcrumbs,
			position: "absolute",
			left: 1,
			top: 0,
		});

		this.listText = new TextRenderable(this.renderer, {
			id: "list",
			content: "",
			fg: colors.itemOpen,
			position: "absolute",
			left: 1,
			top: 2,
		});

		this.feedbackText = new TextRenderable(this.renderer, {
			id: "feedback",
			content: "",
			fg: colors.feedback,
			attributes: TextAttributes.BOLD,
			position: "absolute",
			left: 2,
			top: height - 3,
		});

		this.hintsText = new TextRenderable(this.renderer, {
			id: "hints",
			content:
				"↑↓ select  →/space enter  ← back  n new  e edit  d done  x del  m mode  q quit",
			fg: colors.keyHints,
			position: "absolute",
			left: 1,
			top: height - 1,
		});

		this.renderer.root.add(this.mainContainer);
		this.renderer.root.add(this.breadcrumbText);
		this.renderer.root.add(this.listText);
		this.renderer.root.add(this.feedbackText);
		this.renderer.root.add(this.hintsText);

		this.modalContainer = null;
	}

	async start(): Promise<void> {
		this.isRunning = true;
		this.renderer.keyInput.on("keypress", this.handleKeyPress.bind(this));
		this.updateDisplay();

		return new Promise((resolve) => {
			const checkRunning = setInterval(() => {
				if (!this.isRunning) {
					clearInterval(checkRunning);
					resolve();
				}
			}, 100);
		});
	}

	private updateDisplay(): void {
		const width = process.stdout.columns || 80;
		ensureValidSelection(this.state);
		this.breadcrumbText.content = this.formatBreadcrumb(width);
		const height = process.stdout.rows || 24;
		if (this.state.viewMode === "zen") {
			this.listText.content = this.formatZen(width, height);
		} else {
			this.listText.content = this.formatList(width);
		}
		this.feedbackText.content = this.state.feedbackMessage || "";
		this.updateModal();
	}

	private formatBreadcrumb(width: number): string {
		const path = getBreadcrumbPath(this.state);

		if (path.length === 0) {
			return truncate(this.state.project.project_name, width - 2);
		}

		const segments = path.map((n) => truncate(n.title, 20));
		let breadcrumb = segments.join(" > ");

		if (breadcrumb.length > width - 2) {
			while (segments.length > 1 && breadcrumb.length > width - 8) {
				segments.shift();
				breadcrumb = `... > ${segments.join(" > ")}`;
			}
		}

		return breadcrumb;
	}

	private allDescendantsDone(node: Node): boolean {
		for (const child of node.children) {
			if (child.status !== "done") return false;
			if (!this.allDescendantsDone(child)) return false;
		}
		return true;
	}

	private getStatusDisplay(item: Node): string {
		if (item.status !== "done") {
			return "";
		}

		if (item.children.length === 0) {
			return " (done)";
		}

		if (this.allDescendantsDone(item)) {
			return " (done)";
		}

		return " (done, partial)";
	}

	private getChildCountDisplay(item: Node): string {
		const count = countDescendants(item);
		if (count === 0) return "";
		return ` [${count}]`;
	}

	private formatZen(width: number, height: number): string {
		const selected = getSelectedNode(this.state);
		if (!selected) {
			return "No items. Press 'n' to create one.";
		}

		const lines: string[] = [];

		const title = truncate(selected.title, width - 4);
		const status = this.getStatusDisplay(selected);
		const childCount = this.getChildCountDisplay(selected);

		lines.push(`> ${title}${childCount}${status}`);

		const availableLines = (height || 24) - 6;
		for (let i = 1; i < availableLines; i++) {
			lines.push("");
		}

		return lines.join("\n");
	}

	private formatList(width: number): string {
		const list = getCurrentList(this.state);

		if (list.length === 0) {
			return "No items. Press 'n' to create one.";
		}

		const lines: string[] = [];
		const maxShow = Math.min(list.length, (process.stdout.rows || 24) - 6);
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

	private updateModal(): void {
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

	private handleKeyPress(key: KeyEvent): void {
		if (this.state.modalState) {
			this.handleModalKeyPress(key);
		} else {
			this.handleNavigationKeyPress(key);
		}
	}

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

			case "m":
				this.toggleViewMode();
				break;
		}
	}

	private toggleViewMode(): void {
		const currentMode: ViewMode = this.state.viewMode;
		this.state.viewMode = currentMode === "zen" ? "list" : "zen";
		this.showFeedback(
			this.state.viewMode === "zen" ? "Zen Mode" : "List Mode",
		);
	}

	private handleNavigation(result: { success: boolean; feedbackMessage?: string }): void {
		if (!result.success && result.feedbackMessage) {
			this.showFeedback(result.feedbackMessage);
		}
		this.updateDisplay();
	}

	private openModal(type: ModalState["type"]): void {
		this.state.modalState = {
			type,
			inputValue: "",
			selectedButton: 0,
		};
		this.updateDisplay();
	}

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

	private closeModal(): void {
		this.state.modalState = null;
		this.updateDisplay();
	}

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
						let sanitized: string | null = null;
						if (/^[a-zA-Z]$/.test(char)) {
							sanitized = char.toLowerCase();
						} else if (/^[0-9 _-]$/.test(char)) {
							sanitized = char;
						}

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
