import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  resolveSessionAccess,
  resolveMissingConfigAccess,
  isMainPath,
  isPublicEmbedPath,
  isIllustrativeReviewPath,
} from "./access-decision"
import { safeReturnPath, loginHrefWithReturn } from "./safe-return-path"
import {
  validateBridgeLinkDraft,
  IDENTITY_BRIDGE_ACTIVATION,
} from "../identity-bridge/contract"
import { getMnkyIdEnrollmentLink, getVipPortalLink } from "../mnky-id"

describe("public Main access", () => {
  it("allows guest and signed-in and pending on /main", () => {
    for (const pathname of ["/main", "/main/about"]) {
      assert.deepEqual(
        resolveSessionAccess({ pathname, hasUser: false, profile: null }),
        { type: "allow" },
      )
      assert.deepEqual(
        resolveSessionAccess({
          pathname,
          hasUser: true,
          profile: { role: "user" },
        }),
        { type: "allow" },
      )
      assert.deepEqual(
        resolveSessionAccess({
          pathname,
          hasUser: true,
          profile: { role: "pending" },
        }),
        { type: "allow" },
      )
      assert.deepEqual(
        resolveSessionAccess({
          pathname,
          hasUser: true,
          profile: { role: "admin", is_admin: true },
        }),
        { type: "allow" },
      )
    }
    assert.equal(isMainPath("/main"), true)
  })
})

describe("protected Dojo / LABZ", () => {
  it("redirects anonymous Dojo and platform to login", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/dojo/me",
        hasUser: false,
        profile: null,
      }),
      { type: "redirect", pathname: "/auth/login" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/platform",
        hasUser: false,
        profile: null,
      }),
      { type: "redirect", pathname: "/auth/login" },
    )
  })

  it("does not grant Dojo to pending; keeps LABZ admin-only for non-admins", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/dojo",
        hasUser: true,
        profile: { role: "pending" },
      }),
      { type: "redirect", pathname: "/auth/pending-approval" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/platform",
        hasUser: true,
        profile: { role: "user" },
      }),
      { type: "redirect", pathname: "/dojo" },
    )
  })

  it("allows approved members on Dojo embeds publicly when unauthenticated", () => {
    assert.equal(isPublicEmbedPath("/dojo/glossary"), true)
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/dojo/glossary",
        hasUser: false,
        profile: null,
      }),
      { type: "allow" },
    )
  })
})

describe("missing Supabase config fail-closed", () => {
  it("allows Main, auth UI, embeds, and illustrative review only", () => {
    assert.deepEqual(resolveMissingConfigAccess("/main"), { type: "allow" })
    assert.deepEqual(resolveMissingConfigAccess("/auth/login"), {
      type: "allow",
    })
    assert.deepEqual(resolveMissingConfigAccess("/dojo/glossary"), {
      type: "allow",
    })
    assert.equal(isIllustrativeReviewPath("/review/member-home"), true)
    assert.deepEqual(resolveMissingConfigAccess("/review/member-home"), {
      type: "allow",
    })
  })

  it("blocks Dojo/member, LABZ/platform, and APIs when config missing", () => {
    assert.deepEqual(resolveMissingConfigAccess("/dojo/me"), {
      type: "redirect",
      pathname: "/auth/login",
    })
    assert.deepEqual(resolveMissingConfigAccess("/platform"), {
      type: "redirect",
      pathname: "/auth/login",
    })
    assert.deepEqual(resolveMissingConfigAccess("/api/me"), {
      type: "unavailable",
      status: 503,
    })
    // ?review=1 is not evaluated here — pathname alone must not unlock Dojo
    assert.deepEqual(resolveMissingConfigAccess("/dojo/me"), {
      type: "redirect",
      pathname: "/auth/login",
    })
  })

  it("never treats review paths as granting session access via resolveSessionAccess guest rules alone beyond allow", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/review/member-home",
        hasUser: false,
        profile: null,
      }),
      { type: "allow" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/dojo/me",
        hasUser: false,
        profile: null,
      }),
      { type: "redirect", pathname: "/auth/login" },
    )
  })
})

describe("safe return + gated links + bridge draft", () => {
  it("sanitizes next and builds login href", () => {
    assert.equal(safeReturnPath("//evil"), "/")
    assert.equal(
      loginHrefWithReturn("/dojo/me"),
      "/auth/login?next=%2Fdojo%2Fme",
    )
  })

  it("keeps enrollment/VIP gated off by default", () => {
    const emptyEnv = {} as NodeJS.ProcessEnv
    assert.deepEqual(getMnkyIdEnrollmentLink(emptyEnv), {
      enabled: false,
      reason: "flag_off",
    })
    assert.deepEqual(getVipPortalLink(emptyEnv), {
      enabled: false,
      reason: "flag_off",
    })
  })

  it("bridge stays inactive; rejects email subjects", () => {
    assert.equal(IDENTITY_BRIDGE_ACTIVATION.enabled, false)
    assert.deepEqual(
      validateBridgeLinkDraft({
        commandUserId: "uuid",
        oidcIssuer: "https://id.example",
        oidcSubject: "user@example.com",
        proofKind: "interactive_consent",
        status: "draft",
      }),
      { ok: false, error: "subject must not be an email address" },
    )
    assert.deepEqual(
      validateBridgeLinkDraft({
        commandUserId: "uuid",
        oidcIssuer: "https://id.example",
        oidcSubject: "sub-123",
        proofKind: "interactive_consent",
        status: "draft",
      }),
      { ok: true },
    )
  })
})
