import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { getRewrittenPath } from "./lib/auth/root-rewrite"

describe("preview root rewrite", () => {
  it("rewrites / to /main so share tokens on root land brand home", () => {
    assert.equal(getRewrittenPath("/"), "/main")
    assert.equal(getRewrittenPath("/main"), null)
    assert.equal(getRewrittenPath("/auth/login"), null)
  })
})
