import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  resolveSessionAccess,
  isMainPath,
  isMemberPath,
  isPublicVerseEmbedPath,
} from "./access-decision"
import { safeReturnPath, loginHrefWithReturn } from "./safe-return-path"

describe("isMainPath / isMemberPath", () => {
  it("recognizes Main brand routes", () => {
    assert.equal(isMainPath("/main"), true)
    assert.equal(isMainPath("/main/mnky-id"), true)
    assert.equal(isMainPath("/main/mnky-id/create"), true)
    assert.equal(isMainPath("/dojo"), false)
  })

  it("recognizes member Dojo/Verse routes without treating Main as member", () => {
    assert.equal(isMemberPath("/dojo"), true)
    assert.equal(isMemberPath("/dojo/me"), true)
    assert.equal(isMemberPath("/verse"), true)
    assert.equal(isMemberPath("/main"), false)
    assert.equal(isMemberPath("/platform"), false)
  })

  it("keeps legacy public verse embeds narrow", () => {
    assert.equal(isPublicVerseEmbedPath("/verse/glossary"), true)
    assert.equal(isPublicVerseEmbedPath("/dojo/glossary"), false)
    assert.equal(isPublicVerseEmbedPath("/verse/me"), false)
  })
})

describe("resolveSessionAccess — public Main", () => {
  it("allows anonymous Main homepage and MNKY ID entry pages", () => {
    for (const pathname of [
      "/main",
      "/main/mnky-id",
      "/main/mnky-id/create",
      "/main/mnky-id/sign-in",
      "/main/about",
    ]) {
      assert.deepEqual(
        resolveSessionAccess({ pathname, hasUser: false, profile: null }),
        { type: "allow" },
      )
    }
  })

  it("allows signed-in regular users on Main without Dojo bounce", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/main",
        hasUser: true,
        profile: { role: "user", is_admin: false },
      }),
      { type: "allow" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/main/mnky-id",
        hasUser: true,
        profile: { role: "user", is_admin: false },
      }),
      { type: "allow" },
    )
  })

  it("allows pending users on public Main only", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/main",
        hasUser: true,
        profile: { role: "pending" },
      }),
      { type: "allow" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/main/mnky-id/create",
        hasUser: true,
        profile: { role: "pending" },
      }),
      { type: "allow" },
    )
  })
})

describe("resolveSessionAccess — protected routes", () => {
  it("redirects anonymous users away from Dojo/member and admin routes", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/dojo",
        hasUser: false,
        profile: null,
      }),
      { type: "redirect", pathname: "/auth/login" },
    )
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

  it("keeps auth login/sign-up/callback paths public", () => {
    for (const pathname of [
      "/auth/login",
      "/auth/sign-up",
      "/auth/callback",
      "/auth/confirm",
      "/auth/forgot-password",
    ]) {
      assert.deepEqual(
        resolveSessionAccess({ pathname, hasUser: false, profile: null }),
        { type: "allow" },
      )
    }
  })

  it("sends pending users to pending-approval for Dojo and LABZ", () => {
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
        profile: { role: "pending" },
      }),
      { type: "redirect", pathname: "/auth/pending-approval" },
    )
  })

  it("redirects non-admin signed-in users away from LABZ/dashboard roots", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/platform",
        hasUser: true,
        profile: { role: "user", is_admin: false },
      }),
      { type: "redirect", pathname: "/verse" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/",
        hasUser: true,
        profile: { role: "user" },
      }),
      { type: "redirect", pathname: "/verse" },
    )
  })

  it("allows admins on LABZ and Main", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/platform",
        hasUser: true,
        profile: { role: "admin", is_admin: true },
      }),
      { type: "allow" },
    )
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/main",
        hasUser: true,
        profile: { role: "admin", is_admin: true },
      }),
      { type: "allow" },
    )
  })

  it("allows approved members on Dojo routes", () => {
    assert.deepEqual(
      resolveSessionAccess({
        pathname: "/dojo/me",
        hasUser: true,
        profile: { role: "user" },
      }),
      { type: "allow" },
    )
  })
})

describe("safeReturnPath", () => {
  it("accepts relative same-origin paths", () => {
    assert.equal(safeReturnPath("/main"), "/main")
    assert.equal(safeReturnPath("/main/mnky-id"), "/main/mnky-id")
  })

  it("rejects open redirects", () => {
    assert.equal(safeReturnPath("https://evil.example"), "/")
    assert.equal(safeReturnPath("//evil.example"), "/")
    assert.equal(safeReturnPath("verse"), "/")
  })

  it("builds login href with encoded next", () => {
    assert.equal(
      loginHrefWithReturn("/main/mnky-id"),
      "/auth/login?next=%2Fmain%2Fmnky-id",
    )
  })
})
