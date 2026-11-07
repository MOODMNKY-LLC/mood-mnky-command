import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  getMnkyIdEnrollmentState,
  getMnkyIdVipPortalState,
  isMnkyIdEnrollmentLive,
  MNKY_ID_ENROLLMENT_URL_REFERENCE,
} from "./mnky-id"

describe("getMnkyIdEnrollmentState", () => {
  it("defaults off without env (preview only)", () => {
    const state = getMnkyIdEnrollmentState({})
    assert.deepEqual(state, { enabled: false, reason: "flag_off" })
    assert.equal(isMnkyIdEnrollmentLive({}), false)
  })

  it("does not enable from a hardcoded URL alone", () => {
    const state = getMnkyIdEnrollmentState({
      NEXT_PUBLIC_MNKY_ID_ENROLLMENT_URL: MNKY_ID_ENROLLMENT_URL_REFERENCE,
    })
    assert.deepEqual(state, { enabled: false, reason: "flag_off" })
  })

  it("requires both flag and URL", () => {
    assert.deepEqual(
      getMnkyIdEnrollmentState({
        NEXT_PUBLIC_MNKY_ID_ENROLLMENT_ENABLED: "true",
      }),
      { enabled: false, reason: "url_missing" },
    )
    assert.deepEqual(
      getMnkyIdEnrollmentState({
        NEXT_PUBLIC_MNKY_ID_ENROLLMENT_ENABLED: "true",
        NEXT_PUBLIC_MNKY_ID_ENROLLMENT_URL: MNKY_ID_ENROLLMENT_URL_REFERENCE,
      }),
      { enabled: true, url: MNKY_ID_ENROLLMENT_URL_REFERENCE },
    )
  })
})

describe("getMnkyIdVipPortalState", () => {
  it("defaults off — no silent VIP deep-link", () => {
    assert.deepEqual(getMnkyIdVipPortalState({}), {
      enabled: false,
      reason: "flag_off",
    })
  })

  it("enables only with flag + URL", () => {
    assert.deepEqual(
      getMnkyIdVipPortalState({
        NEXT_PUBLIC_MNKY_ID_VIP_PORTAL_ENABLED: "1",
        NEXT_PUBLIC_MNKY_ID_VIP_PORTAL_URL: "https://vip.moodmnky.com/auth/sign-in",
      }),
      {
        enabled: true,
        url: "https://vip.moodmnky.com/auth/sign-in",
      },
    )
  })
})
