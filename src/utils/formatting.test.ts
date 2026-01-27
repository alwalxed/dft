import { describe, expect, test } from "bun:test";
import type { Node } from "../data/types";
import {
	countAllNodes,
	countDescendants,
	formatBreadcrumbs,
	formatCheckbox,
	formatStatusBadge,
	truncate,
} from "./formatting";

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

describe("formatStatusBadge", () => {
	test("returns [OPEN] for open status", () => {
		expect(formatStatusBadge("open")).toBe("[OPEN]");
	});

	test("returns [DONE] for done status", () => {
		expect(formatStatusBadge("done")).toBe("[DONE]");
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

describe("countDescendants", () => {
	test("returns 0 for node with no children", () => {
		const node: Node = {
			id: "1",
			title: "Test",
			status: "open",
			children: [],
			created_at: new Date().toISOString(),
			completed_at: null,
		};
		expect(countDescendants(node)).toBe(0);
	});

	test("counts direct children", () => {
		const node: Node = {
			id: "1",
			title: "Test",
			status: "open",
			children: [
				{
					id: "2",
					title: "Child 1",
					status: "open",
					children: [],
					created_at: "",
					completed_at: null,
				},
				{
					id: "3",
					title: "Child 2",
					status: "open",
					children: [],
					created_at: "",
					completed_at: null,
				},
			],
			created_at: "",
			completed_at: null,
		};
		expect(countDescendants(node)).toBe(2);
	});

	test("counts nested children", () => {
		const node: Node = {
			id: "1",
			title: "Root",
			status: "open",
			children: [
				{
					id: "2",
					title: "Child",
					status: "open",
					children: [
						{
							id: "3",
							title: "Grandchild",
							status: "open",
							children: [],
							created_at: "",
							completed_at: null,
						},
					],
					created_at: "",
					completed_at: null,
				},
			],
			created_at: "",
			completed_at: null,
		};
		expect(countDescendants(node)).toBe(2);
	});
});

describe("countAllNodes", () => {
	test("returns 1 for single node", () => {
		const node: Node = {
			id: "1",
			title: "Test",
			status: "open",
			children: [],
			created_at: "",
			completed_at: null,
		};
		expect(countAllNodes(node)).toBe(1);
	});

	test("includes root and all descendants", () => {
		const node: Node = {
			id: "1",
			title: "Root",
			status: "open",
			children: [
				{
					id: "2",
					title: "Child 1",
					status: "open",
					children: [],
					created_at: "",
					completed_at: null,
				},
				{
					id: "3",
					title: "Child 2",
					status: "open",
					children: [],
					created_at: "",
					completed_at: null,
				},
			],
			created_at: "",
			completed_at: null,
		};
		expect(countAllNodes(node)).toBe(3);
	});
});

describe("formatBreadcrumbs", () => {
	test("returns project name at root level", () => {
		const path: Node[] = [
			{ id: "1", title: "Root", status: "open", children: [], created_at: "", completed_at: null },
		];
		expect(formatBreadcrumbs(path, "my-project")).toBe("my-project");
	});

	test("shows path to parent", () => {
		const path: Node[] = [
			{ id: "1", title: "Root", status: "open", children: [], created_at: "", completed_at: null },
			{ id: "2", title: "Child", status: "open", children: [], created_at: "", completed_at: null },
		];
		expect(formatBreadcrumbs(path, "my-project")).toBe("Root");
	});
});
