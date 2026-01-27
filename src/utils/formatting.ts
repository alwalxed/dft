export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.substring(0, maxLength - 3)}...`;
}

export function formatCheckbox(status: "open" | "done"): string {
	return status === "done" ? "[x]" : "[ ]";
}
