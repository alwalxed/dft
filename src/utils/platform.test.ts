import { describe, expect, test } from "bun:test";
import { getDataDir, getProjectPath, getProjectsDir } from "./platform";

describe("getDataDir", () => {
	test("returns a non-empty string", () => {
		const dataDir = getDataDir();
		expect(typeof dataDir).toBe("string");
		expect(dataDir.length).toBeGreaterThan(0);
	});
});

describe("getProjectsDir", () => {
	test("includes depthfirst/projects", () => {
		const projectsDir = getProjectsDir();
		expect(projectsDir).toContain("depthfirst");
		expect(projectsDir).toContain("projects");
	});
});

describe("getProjectPath", () => {
	test("returns path with .json extension", () => {
		const path = getProjectPath("my-project");
		expect(path).toEndWith(".json");
	});

	test("converts name to lowercase", () => {
		const path = getProjectPath("MyProject");
		expect(path).toContain("myproject.json");
	});
});
