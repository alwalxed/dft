/**
 * Data types for the Depth-First Thinking (dft) application
 */

/** Node status - either open or done */
export type NodeStatus = "open" | "done";

/** A node in the problem tree */
export interface Node {
	/** Unique identifier (UUID v4, 36 characters) */
	id: string;
	/** Title of the problem (1-200 characters, single-line, trimmed) */
	title: string;
	/** Current status */
	status: NodeStatus;
	/** Child nodes (0-1000 nodes, insertion order preserved) */
	children: Node[];
	/** Creation timestamp (ISO-8601, immutable) */
	created_at: string;
	/** Completion timestamp (ISO-8601 or null, set when status is "done") */
	completed_at: string | null;
}

/** Project schema stored in JSON files */
export interface Project {
	/** Project name (lowercase, 1-50 chars, alphanumeric with hyphens/underscores) */
	project_name: string;
	/** Schema version */
	version: string;
	/** Creation timestamp (ISO-8601) */
	created_at: string;
	/** Last modification timestamp (ISO-8601) */
	modified_at: string;
	/** Root node of the problem tree */
	root: Node;
}

/** Modal state types */
export type ModalType = "new" | "edit" | "delete" | "help";

/** Modal state for the TUI */
export interface ModalState {
	type: ModalType;
	/** Input value for new/edit modals */
	inputValue?: string;
	/** Error message to display */
	errorMessage?: string;
	/** Selected button index */
	selectedButton?: number;
}

/** Application state for the TUI */
export interface AppState {
	/** Loaded project JSON (source of truth) */
	project: Project;
	/** Array of parent node IDs (empty = viewing root's children) */
	navigationStack: string[];
	/** Index of selected item in the current list */
	selectedIndex: number;
	/** Active modal or null */
	modalState: ModalState | null;
	/** Temporary feedback message */
	feedbackMessage: string | null;
	/** Feedback message timeout */
	feedbackTimeout?: ReturnType<typeof setTimeout>;
}

/** Exit codes for CLI commands */
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
