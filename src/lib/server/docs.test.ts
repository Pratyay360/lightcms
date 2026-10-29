import { describe, expect, it } from "vitest";
import { groupDocsBySection, loadDocEntries } from "./docs";
import { renderDocMarkdown } from "./markdown";

describe("Documentation System", () => {
  it("loads and categorizes doc entries", async () => {
    const entries = await loadDocEntries();
    expect(entries.length).toBeGreaterThan(0);

    const intro = entries.find((e) => e.slug === "getting-started-with-lightcms");
    expect(intro).toBeDefined();
    expect(intro?.section).toBe("Get Started");
    expect(intro?.title).toBe("Introduction");

    const sections = groupDocsBySection(entries);
    expect(sections.length).toBeGreaterThan(0);
    expect(sections[0].title).toBe("Get Started");
	  });

  it("renders markdown and extracts headings for table of contents", async () => {
    const source = `
# Main Title
This is intro text.

## Core Pillars
Some content here.

### 1. Git-Backed Storage
Nested content.

## Another Section
More content.
`;
    const result = await renderDocMarkdown(source);
    expect(result.html).toContain('id="core-pillars"');
    expect(result.html).toContain('id="1-git-backed-storage"');
    expect(result.html).toContain('id="another-section"');

    expect(result.headings).toHaveLength(3);
    expect(result.headings[0]).toEqual({
      id: "core-pillars",
      text: "Core Pillars",
      depth: 2,
    });
    expect(result.headings[1]).toEqual({
      id: "1-git-backed-storage",
      text: "1. Git-Backed Storage",
      depth: 3,
    });
    expect(result.headings[2]).toEqual({
      id: "another-section",
      text: "Another Section",
      depth: 2,
    });
  });
});
