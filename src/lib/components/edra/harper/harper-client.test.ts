import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

/**
 * `WorkerLinter` needs a browser Worker and the WASM binary, so it is stubbed out here:
 * these tests cover how the client caches and recovers the linter setup.
 */
const setupMock = vi.fn(async () => {});
const lintMock = vi.fn(async () => []);
const wasmSetupMock = vi.fn(async () => {});
const createBinaryModuleFromUrlMock = vi.fn(() => ({ setup: wasmSetupMock }));
const workerLinterInitMock = vi.fn();

vi.mock("harper.js", () => ({
  createBinaryModuleFromUrl: createBinaryModuleFromUrlMock,
  WorkerLinter: class {
    constructor(init: unknown) {
      workerLinterInitMock(init);
    }
    setup = setupMock;
    lint = lintMock;
  },
}));

vi.mock("harper.js/binary", () => ({
  binary: { url: "https://example.test/harper_wasm_bg.wasm", glueFlavor: "full" },
}));

const loadClient = () => import("./harper-client.ts");

describe("harper-client", () => {
  beforeEach(() => {
    vi.resetModules();
    setupMock.mockReset();
    setupMock.mockResolvedValue(undefined);
    lintMock.mockClear();
    wasmSetupMock.mockReset();
    wasmSetupMock.mockResolvedValue(undefined);
    createBinaryModuleFromUrlMock.mockClear();
    workerLinterInitMock.mockClear();
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

  it("loads a fresh WASM module before it creates the worker linter", async () => {
    const { lintText } = await loadClient();

    await lintText("Some text.");
    expect(createBinaryModuleFromUrlMock).toHaveBeenCalledWith(
      "https://example.test/harper_wasm_bg.wasm",
      "full",
    );
    expect(wasmSetupMock).toHaveBeenCalledTimes(1);
    expect(workerLinterInitMock).toHaveBeenCalledWith({
      binary: createBinaryModuleFromUrlMock.mock.results[0].value,
    });
  });

  it("retries with a new WASM module after a failed WASM load", async () => {
    wasmSetupMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    const { lintText } = await loadClient();

    await expect(lintText("Some text.")).rejects.toThrow("Failed to fetch");
    expect(workerLinterInitMock).not.toHaveBeenCalled();

    await expect(lintText("Some text.")).resolves.toEqual([]);
    expect(createBinaryModuleFromUrlMock).toHaveBeenCalledTimes(2);
    expect(workerLinterInitMock).toHaveBeenCalledTimes(1);
  });

  it("reuses the linter after a successful setup", async () => {
    const { lintText, primeHarper } = await loadClient();

    primeHarper();
    await lintText("Some text.");
    await lintText("More text.");
    expect(setupMock).toHaveBeenCalledTimes(1);
  });
});
