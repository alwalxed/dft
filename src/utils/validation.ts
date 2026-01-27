const RESERVED_NAMES = ["list", "new", "delete", "open", "tree", "help", "version"];

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

export function isValidProjectName(name: string): boolean {
	return validateProjectName(name).isValid;
}

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

export function isValidTitle(title: string): boolean {
	return validateTitle(title).isValid;
}
