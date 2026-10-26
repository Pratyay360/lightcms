import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

/**
 * `WorkerLinter` needs a browser Worker and the WASM binary, so it is stubbed out here:
 * these tests cover how the client caches and recovers the linter setup.
 */
const setupMock = vi.fn(async () => {});
const lintMock = vi.fn(async () => []);

vi.mock("harper.js", () => ({
  WorkerLinter: class {
    setup = setupMock;
    lint = lintMock;
  },
}));

vi.mock("harper.js/binary", () => ({ binary: {} }));

const loadClient = () => import("./harper-client.ts");

describe("harper-client", () => {
  beforeEach(() => {
    vi.resetModules();
    setupMock.mockReset();
    setupMock.mockResolvedValue(undefined);
    lintMock.mockClear();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("handles a failed setup in primeHarper", async () => {
    const failure = new TypeError("Failed to fetch");
    setupMock.mockRejectedValueOnce(failure);
    const { primeHarper } = await loadClient();

    primeHarper();
    await vi.waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("[harper] linter setup failed:", failure);
    });
  });

  it("retries the setup on the next lint after a failure", async () => {
    setupMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { lintText } = await loadClient();

    await expect(lintText("Some text.")).rejects.toThrow("Failed to fetch");
    await expect(lintText("Some text.")).resolves.toEqual([]);
    expect(setupMock).toHaveBeenCalledTimes(2);
    expect(lintMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the linter after a successful setup", async () => {
    const { lintText, primeHarper } = await loadClient();

    primeHarper();
    await lintText("Some text.");
    await lintText("More text.");
    expect(setupMock).toHaveBeenCalledTimes(1);
  });
});
