import { describe, expect, test } from "bun:test";
import {
	isValidProjectName,
	isValidTitle,
	normalizeProjectName,
	validateProjectName,
	validateTitle,
} from "./validation";

describe("validateProjectName", () => {
	test("accepts valid project names", () => {
		expect(validateProjectName("my-project").isValid).toBe(true);
		expect(validateProjectName("project123").isValid).toBe(true);
		expect(validateProjectName("test_project").isValid).toBe(true);
		expect(validateProjectName("a").isValid).toBe(true);
	});

	test("rejects empty names", () => {
		const result = validateProjectName("");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("at least 1 character");
	});

	test("rejects names longer than 50 characters", () => {
		const longName = "a".repeat(51);
		const result = validateProjectName(longName);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("50 characters or less");
	});

	test("rejects names starting with non-alphanumeric", () => {
		const result = validateProjectName("-project");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("start with a letter or number");
	});

	test("rejects names with invalid characters", () => {
		const result = validateProjectName("my project");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("letters, numbers, hyphens, and underscores");
	});

	test("rejects reserved names", () => {
		const reserved = ["list", "new", "delete", "open", "tree", "help", "version"];
		for (const name of reserved) {
			const result = validateProjectName(name);
			expect(result.isValid).toBe(false);
			expect(result.error).toContain("reserved name");
		}
	});
});

describe("isValidProjectName", () => {
	test("returns true for valid names", () => {
		expect(isValidProjectName("valid-name")).toBe(true);
	});

	test("returns false for invalid names", () => {
		expect(isValidProjectName("")).toBe(false);
		expect(isValidProjectName("list")).toBe(false);
	});
});

describe("normalizeProjectName", () => {
	test("converts to lowercase", () => {
		expect(normalizeProjectName("MyProject")).toBe("myproject");
		expect(normalizeProjectName("TEST")).toBe("test");
	});
});

describe("validateTitle", () => {
	test("accepts valid titles", () => {
		expect(validateTitle("Build authentication").isValid).toBe(true);
		expect(validateTitle("a").isValid).toBe(true);
	});

	test("rejects empty titles", () => {
		const result = validateTitle("");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("empty");
	});

	test("rejects whitespace-only titles", () => {
		const result = validateTitle("   ");
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("empty");
	});

	test("rejects titles longer than 200 characters", () => {
		const longTitle = "a".repeat(201);
		const result = validateTitle(longTitle);
		expect(result.isValid).toBe(false);
		expect(result.error).toContain("200 characters or less");
	});
});

describe("isValidTitle", () => {
	test("returns true for valid titles", () => {
		expect(isValidTitle("Valid title")).toBe(true);
	});

	test("returns false for invalid titles", () => {
		expect(isValidTitle("")).toBe(false);
		expect(isValidTitle("   ")).toBe(false);
	});
});
