/**
 * Display formatting utilities
 */

/**
 * Truncates a string to a maximum length with ellipsis
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length (including ellipsis)
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.substring(0, maxLength - 3)}...`;
}

/**
 * Formats a checkbox marker for tree display (used by tree command)
 *
 * @param status - The node status
 * @returns Checkbox marker
 */
export function formatCheckbox(status: "open" | "done"): string {
	return status === "done" ? "[x]" : "[ ]";
}
