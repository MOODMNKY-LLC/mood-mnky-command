/**
 * App Factory: server-side connectivity checks for GitHub and Coolify.
 * Used by the launch page to show integration status without exposing token names.
 */

import { Octokit } from "octokit";
import { getCoolifyApiKey, getCoolifyUrl, getGitHubToken } from "./env";

export type ConnectivityStatus = {
  github: { ok: boolean };
  coolify: { ok: boolean };
};

/**
 * Check GitHub API with current token (e.g. GET /user).
 * Returns { ok: true } if authenticated, { ok: false } otherwise.
 */
async function checkGitHub(): Promise<{ ok: boolean }> {
  const token = getGitHubToken();
  if (!token?.trim()) return { ok: false };
  try {
    const octokit = new Octokit({ auth: token });
    const { status } = await octokit.rest.users.getAuthenticated();
    return { ok: status === 200 };
  } catch {
    return { ok: false };
  }
}

/**
 * Check Coolify API with current URL and API key (e.g. GET /api/v1/servers).
 * Returns { ok: true } if auth and reachable, { ok: false } otherwise.
 */
async function checkCoolify(): Promise<{ ok: boolean }> {
  const baseUrl = getCoolifyUrl();
  const token = getCoolifyApiKey();
  if (!baseUrl?.trim() || !token?.trim()) return { ok: false };
  try {
    const url = `${baseUrl.replace(/\/$/, "")}/api/v1/servers`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}

/**
 * Run GitHub and Coolify connectivity checks. Safe to call from server components.
 */
export async function getAppFactoryConnectivity(): Promise<ConnectivityStatus> {
  const [github, coolify] = await Promise.all([checkGitHub(), checkCoolify()]);
  return { github, coolify };
}
