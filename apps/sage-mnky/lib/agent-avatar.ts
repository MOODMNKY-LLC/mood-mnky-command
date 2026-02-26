/**
 * Resolve 3D avatar URL for this agent.
 * Serves from this app's public/verse/ so avatars work locally and without CORS.
 * Use sage-mnky-3d.svg (placeholder) or add sage-mnky-3d.png from /temp for the real 3D asset.
 */
export const AGENT_AVATAR_PATH = "/verse/sage-mnky-3d.png"
export function getAgentAvatarUrl(): string {
  return AGENT_AVATAR_PATH
}
