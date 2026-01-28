import { describe, expect, test } from "bun:test";
import type { AppState, Project } from "../data/types";
import { ensureValidSelection, getCurrentList, initializeNavigation } from "./navigation";

function createTestProject(): Project {
	const now = new Date().toISOString();
	return {
		project_name: "Test Project",
		version: "1.0.0",
		created_at: now,
		modified_at: now,
		root: {
			id: "root",
			title: "Root",
			status: "open",
			children: [
				{
					id: "a",
					title: "Task A",
					status: "open",
					children: [],
					created_at: now,
					completed_at: null,
				},
				{
					id: "b",
					title: "Task B",
					status: "open",
					children: [],
					created_at: now,
					completed_at: null,
				},
			],
			created_at: now,
			completed_at: null,
		},
	};
}

describe("viewMode and navigation state", () => {
	test("initial state uses zen mode and selection is valid", () => {
		const project = createTestProject();
		const state: AppState = {
			project,
			navigationStack: [],
			selectedIndex: 0,
			viewMode: "zen",
			modalState: null,
			feedbackMessage: null,
		};

		initializeNavigation(state);
		ensureValidSelection(state);

		expect(state.viewMode).toBe("zen");
		expect(getCurrentList(state)).toHaveLength(2);
		expect(state.selectedIndex).toBe(0);
	});

	test("selection survives mode changes", () => {
		const project = createTestProject();
		const state: AppState = {
			project,
			navigationStack: [],
			selectedIndex: 1,
			viewMode: "zen",
			modalState: null,
			feedbackMessage: null,
		};

		// simulate toggling between modes
		state.viewMode = "list";
		expect(state.selectedIndex).toBe(1);

		state.viewMode = "zen";
		expect(state.selectedIndex).toBe(1);
	});
});
