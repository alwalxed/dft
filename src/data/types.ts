export type NodeStatus = "open" | "done";

export interface Node {
	id: string;
	title: string;
	status: NodeStatus;
	children: Node[];
	created_at: string;
	completed_at: string | null;
}

export interface Project {
	project_name: string;
	version: string;
	created_at: string;
	modified_at: string;
	root: Node;
}

export type ModalType = "new" | "edit" | "delete" | "help";

export interface ModalState {
	type: ModalType;
	inputValue?: string;
	errorMessage?: string;
	selectedButton?: number;
}

export interface AppState {
	project: Project;
	navigationStack: string[];
	selectedIndex: number;
	modalState: ModalState | null;
	feedbackMessage: string | null;
	feedbackTimeout?: ReturnType<typeof setTimeout>;
}

export const ExitCodes = {
	SUCCESS: 0,
	INVALID_NAME: 1,
	ALREADY_EXISTS: 2,
	FILESYSTEM_ERROR: 3,
	NOT_FOUND: 1,
	CANCELLED: 2,
	CORRUPTED: 2,
	TUI_ERROR: 3,
} as const;
