import { describe, expect, test } from "bun:test";
import {
	addChildNode,
	buildPathToNode,
	createNode,
	deleteNode,
	editNodeTitle,
	findNode,
	findParent,
	getNextSibling,
	getNodePath,
	getPreviousSibling,
	getSiblingIndex,
	markNodeDone,
	markNodeOpen,
	toggleNodeStatus,
} from "./operations";
import type { Node } from "./types";

function createTestNode(title: string, id?: string): Node {
	return {
		id: id || crypto.randomUUID(),
		title,
		status: "open",
		children: [],
		created_at: new Date().toISOString(),
		completed_at: null,
	};
}

describe("createNode", () => {
	test("creates node with correct properties", () => {
		const node = createNode("Test Title");
		expect(node.title).toBe("Test Title");
		expect(node.status).toBe("open");
		expect(node.children).toEqual([]);
		expect(node.completed_at).toBeNull();
		expect(node.id).toHaveLength(36);
	});

	test("trims whitespace from title", () => {
		const node = createNode("  Spaced Title  ");
		expect(node.title).toBe("Spaced Title");
	});
});

describe("addChildNode", () => {
	test("adds child to parent", () => {
		const parent = createTestNode("Parent");
		const child = addChildNode(parent, "Child");

		expect(parent.children).toHaveLength(1);
		expect(parent.children[0]).toBe(child);
		expect(child.title).toBe("Child");
	});

	test("preserves insertion order", () => {
		const parent = createTestNode("Parent");
		addChildNode(parent, "First");
		addChildNode(parent, "Second");
		addChildNode(parent, "Third");

		expect(parent.children.map((c) => c.title)).toEqual(["First", "Second", "Third"]);
	});
});

describe("editNodeTitle", () => {
	test("updates the title", () => {
		const node = createTestNode("Original");
		editNodeTitle(node, "Updated");
		expect(node.title).toBe("Updated");
	});

	test("trims whitespace", () => {
		const node = createTestNode("Original");
		editNodeTitle(node, "  New Title  ");
		expect(node.title).toBe("New Title");
	});
});

describe("markNodeDone", () => {
	test("marks node as done", () => {
		const node = createTestNode("Test");
		markNodeDone(node);

		expect(node.status).toBe("done");
		expect(node.completed_at).not.toBeNull();
	});

	test("cascades to children", () => {
		const parent = createTestNode("Parent");
		const child = addChildNode(parent, "Child");
		const grandchild = addChildNode(child, "Grandchild");

		markNodeDone(parent);

		expect(parent.status).toBe("done");
		expect(child.status).toBe("done");
		expect(grandchild.status).toBe("done");
	});
});

describe("markNodeOpen", () => {
	test("marks node as open", () => {
		const node = createTestNode("Test");
		markNodeDone(node); // First mark as done

		markNodeOpen(node);

		expect(node.status).toBe("open" as const);
		expect(node.completed_at).toBeNull();
	});

	test("does not cascade to children", () => {
		const parent = createTestNode("Parent");
		const child = addChildNode(parent, "Child");
		markNodeDone(parent);

		markNodeOpen(parent);

		expect(parent.status).toBe("open" as const);
		expect(child.status).toBe("done" as const); // Still done
	});
});

describe("toggleNodeStatus", () => {
	test("toggles open to done", () => {
		const node = createTestNode("Test");
		toggleNodeStatus(node);
		expect(node.status).toBe("done" as const);
	});

	test("toggles done to open", () => {
		const node = createTestNode("Test");
		markNodeDone(node); // First mark as done
		toggleNodeStatus(node);
		expect(node.status).toBe("open" as const);
	});
});

describe("deleteNode", () => {
	test("removes child from parent", () => {
		const parent = createTestNode("Parent");
		const child = addChildNode(parent, "Child");

		const result = deleteNode(parent, child.id);

		expect(result).toBe(true);
		expect(parent.children).toHaveLength(0);
	});

	test("returns false if child not found", () => {
		const parent = createTestNode("Parent");
		const result = deleteNode(parent, "nonexistent");
		expect(result).toBe(false);
	});
});

describe("findNode", () => {
	test("finds root node", () => {
		const root = createTestNode("Root", "root-id");
		const found = findNode(root, "root-id");
		expect(found).toBe(root);
	});

	test("finds nested node", () => {
		const root = createTestNode("Root");
		const child = addChildNode(root, "Child");
		const grandchild = addChildNode(child, "Grandchild");

		const found = findNode(root, grandchild.id);
		expect(found).toBe(grandchild);
	});

	test("returns null if not found", () => {
		const root = createTestNode("Root");
		const found = findNode(root, "nonexistent");
		expect(found).toBeNull();
	});
});

describe("findParent", () => {
	test("finds parent of child", () => {
		const root = createTestNode("Root");
		const child = addChildNode(root, "Child");

		const parent = findParent(root, child.id);
		expect(parent).toBe(root);
	});

	test("finds parent of grandchild", () => {
		const root = createTestNode("Root");
		const child = addChildNode(root, "Child");
		const grandchild = addChildNode(child, "Grandchild");

		const parent = findParent(root, grandchild.id);
		expect(parent).toBe(child);
	});

	test("returns null for root", () => {
		const root = createTestNode("Root");
		const parent = findParent(root, root.id);
		expect(parent).toBeNull();
	});
});

describe("getSiblingIndex", () => {
	test("returns correct index", () => {
		const siblings = [createTestNode("A", "a"), createTestNode("B", "b"), createTestNode("C", "c")];

		expect(getSiblingIndex(siblings, "a")).toBe(0);
		expect(getSiblingIndex(siblings, "b")).toBe(1);
		expect(getSiblingIndex(siblings, "c")).toBe(2);
	});

	test("returns -1 if not found", () => {
		const siblings = [createTestNode("A", "a")];
		expect(getSiblingIndex(siblings, "nonexistent")).toBe(-1);
	});
});

describe("getPreviousSibling", () => {
	test("returns previous sibling", () => {
		const siblings = [createTestNode("A", "a"), createTestNode("B", "b"), createTestNode("C", "c")];

		expect(getPreviousSibling(siblings, "b")?.id).toBe("a");
		expect(getPreviousSibling(siblings, "c")?.id).toBe("b");
	});

	test("returns null for first sibling", () => {
		const siblings = [createTestNode("A", "a"), createTestNode("B", "b")];
		expect(getPreviousSibling(siblings, "a")).toBeNull();
	});
});

describe("getNextSibling", () => {
	test("returns next sibling", () => {
		const siblings = [createTestNode("A", "a"), createTestNode("B", "b"), createTestNode("C", "c")];

		expect(getNextSibling(siblings, "a")?.id).toBe("b");
		expect(getNextSibling(siblings, "b")?.id).toBe("c");
	});

	test("returns null for last sibling", () => {
		const siblings = [createTestNode("A", "a"), createTestNode("B", "b")];
		expect(getNextSibling(siblings, "b")).toBeNull();
	});
});

describe("buildPathToNode", () => {
	test("returns path to root", () => {
		const root = createTestNode("Root", "root");
		const path = buildPathToNode(root, "root");
		expect(path).toEqual(["root"]);
	});

	test("returns path to nested node", () => {
		const root = createTestNode("Root", "root");
		const child = addChildNode(root, "Child");
		child.id = "child";
		const grandchild = addChildNode(child, "Grandchild");
		grandchild.id = "grandchild";

		const path = buildPathToNode(root, "grandchild");
		expect(path).toEqual(["root", "child", "grandchild"]);
	});

	test("returns null if not found", () => {
		const root = createTestNode("Root");
		const path = buildPathToNode(root, "nonexistent");
		expect(path).toBeNull();
	});
});

describe("getNodePath", () => {
	test("returns array of nodes", () => {
		const root = createTestNode("Root", "root");
		const child = addChildNode(root, "Child");

		const path = getNodePath(root, child.id);
		expect(path).toHaveLength(2);
		expect(path?.[0]).toBe(root);
		expect(path?.[1]).toBe(child);
	});
});
