import { describe, expect, test } from "bun:test";
import { formatCheckbox, truncate } from "./formatting";

describe("truncate", () => {
	test("returns text unchanged if shorter than max", () => {
		expect(truncate("hello", 10)).toBe("hello");
	});

	test("returns text unchanged if equal to max", () => {
		expect(truncate("hello", 5)).toBe("hello");
	});

	test("truncates with ellipsis if longer than max", () => {
		expect(truncate("hello world", 8)).toBe("hello...");
	});

	test("handles very short max length", () => {
		expect(truncate("hello", 4)).toBe("h...");
	});
});

describe("formatCheckbox", () => {
	test("returns [ ] for open status", () => {
		expect(formatCheckbox("open")).toBe("[ ]");
	});

	test("returns [x] for done status", () => {
		expect(formatCheckbox("done")).toBe("[x]");
	});
});
