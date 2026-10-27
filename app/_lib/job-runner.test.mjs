import test from "node:test";
import assert from "node:assert/strict";
import { runClaimedJob } from "./job-runner.ts";

function dependencies(overrides = {}) {
  const events = [];
  let clock = 100;
  return {
    events,
    value: {
      process: async (progress) => { await progress(55); return { report: "synthetic result" }; },
      setProgress: async (progress) => events.push(["progress", progress]),
      succeed: async (result, duration) => events.push(["succeed", result, duration]),
      retryOrFail: async (...args) => events.push(["retryOrFail", ...args]),
      log: (event, data) => events.push(["log", event, data]),
      now: () => { clock += 25; return clock; },
      ...overrides,
    },
  };
}

test("job executes, records progress, result, duration and success event", async () => {
  const deps = dependencies();
  const state = await runClaimedJob({ id: "job-1", type: "AI_REPORT", userId: "user-1", payload: {}, attemptCount: 1 }, deps.value);

  assert.equal(state, "SUCCEEDED");
  assert.deepEqual(deps.events.filter(([type]) => type === "progress"), [["progress", 5], ["progress", 55], ["progress", 100]]);
  assert.deepEqual(deps.events.find(([type]) => type === "succeed"), ["succeed", { report: "synthetic result" }, 25]);
  assert.equal(deps.events.find(([, event]) => event === "background_job_succeeded")?.[1], "background_job_succeeded");
});

test("transient failures requeue with backoff; exhausted failures become terminal", async () => {
  for (const [attemptCount, expectedState, terminal, delayMs] of [
    [1, "REQUEUED", false, 10_000],
    [2, "REQUEUED", false, 20_000],
    [3, "FAILED", true, 40_000],
  ]) {
    const deps = dependencies({ process: async () => { throw Object.assign(new Error("private detail"), { code: "UPSTREAM_TIMEOUT" }); } });
    const state = await runClaimedJob({ id: "job-retry", type: "CAKTO_WEBHOOK", userId: null, payload: {}, attemptCount }, deps.value);
    assert.equal(state, expectedState);
    assert.deepEqual(deps.events.find(([type]) => type === "retryOrFail"), ["retryOrFail", "UPSTREAM_TIMEOUT", terminal, delayMs]);
    assert.equal(JSON.stringify(deps.events).includes("private detail"), false);
  }
});
