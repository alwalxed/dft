/**
 * Validation utilities for project names and node titles
 */

/** Reserved project names that cannot be used */
const RESERVED_NAMES = ["list", "new", "delete", "open", "tree", "help", "version"];

/**
 * Validates a project name according to the specification rules:
 * - Length: 1-50 characters
 * - Characters: a-z, 0-9, -, _
 * - Must start with an alphanumeric character
 * - Cannot be a reserved name
 *
 * @param name - The project name to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateProjectName(name: string): {
	isValid: boolean;
	error?: string;
} {
	if (name.length < 1) {
		return {
			isValid: false,
			error: "Project name must be at least 1 character long.",
		};
	}

	if (name.length > 50) {
		return {
			isValid: false,
			error: "Project name must be 50 characters or less.",
		};
	}

	if (!/^[a-zA-Z0-9]/.test(name)) {
		return {
			isValid: false,
			error: "Project name must start with a letter or number.",
		};
	}

	if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
		return {
			isValid: false,
			error: "Project name can only contain letters, numbers, hyphens, and underscores.",
		};
	}

	if (RESERVED_NAMES.includes(name.toLowerCase())) {
		return {
			isValid: false,
			error: `'${name}' is a reserved name. Please choose another.`,
		};
	}

	return { isValid: true };
}

/**
 * Checks if a project name is valid (simplified boolean version)
 *
 * @param name - The project name to validate
 * @returns true if the name is valid, false otherwise
 */
export function isValidProjectName(name: string): boolean {
	return validateProjectName(name).isValid;
}

/**
 * Validates a node title according to the specification rules:
 * - Length: 1-200 characters after trimming
 * - Cannot be empty or whitespace-only
 *
 * @param title - The title to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateTitle(title: string): {
	isValid: boolean;
	error?: string;
} {
	const trimmed = title.trim();

	if (trimmed.length < 1) {
		return {
			isValid: false,
			error: "Title cannot be empty or contain only whitespace.",
		};
	}

	if (trimmed.length > 200) {
		return {
			isValid: false,
			error: "Title must be 200 characters or less.",
		};
	}

	return { isValid: true };
}

/**
 * Checks if a title is valid (simplified boolean version)
 *
 * @param title - The title to validate
 * @returns true if the title is valid, false otherwise
 */
export function isValidTitle(title: string): boolean {
	return validateTitle(title).isValid;
}

/**
 * Normalizes a project name (converts to lowercase)
 *
 * @param name - The project name to normalize
 * @returns Normalized (lowercase) project name
 */
export function normalizeProjectName(name: string): string {
	return name.toLowerCase();
}
