import { describe, expect, test } from "bun:test";
import { compareVersions } from "./update";

describe("compareVersions", () => {
	test("returns 0 for equal versions", () => {
		expect(compareVersions("2.1.4", "2.1.4")).toBe(0);
	});

	test("returns -1 when current is older than latest", () => {
		expect(compareVersions("2.1.4", "2.1.5")).toBe(-1);
		expect(compareVersions("2.1.9", "2.2.0")).toBe(-1);
	});

	test("returns 1 when current is newer than latest", () => {
		expect(compareVersions("2.1.5", "2.1.4")).toBe(1);
		expect(compareVersions("2.10.0", "2.2.0")).toBe(1);
	});

	test("handles prerelease versions according to semver rules", () => {
		expect(compareVersions("2.1.5-beta.1", "2.1.5")).toBe(-1);
		expect(compareVersions("2.1.5", "2.1.5-beta.1")).toBe(1);
	});
});
