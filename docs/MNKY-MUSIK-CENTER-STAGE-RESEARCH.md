# MNKY MUSIK: Center-Stage and Marquee Deep Research Report

**Context:** Pull-to-center overlay for the playing track, reverse Jellyfin Music marquee, and 3D marquee display improvements for the MNKY MUSIK / Jellyfin Music sections.

**Themes investigated:** (1) Pull-to-center and spotlight patterns in music and carousel UIs; (2) 3D marquee and perspective in product UI; (3) Scrolling music strips and the 8-track metaphor.

---

## 1. Knowledge Development

The investigation began with the observation that many music and media UIs use a “spotlight” or “pull to center” pattern to bring the active item into focus. This pattern has roots in Cover Flow and similar interfaces where a single item is centered and emphasized while surrounding items remain visible but de-emphasized. The research then traced how this idea appears in modern carousels (slider, slider+scale, slider+rotation, 3D stack, fader), in Android Material carousel layouts (multi-browse, hero, uncontained), and in scroll-driven and CSS-based implementations. A critical thread was accessibility: how center focus is communicated (aria-live, focus management, scroll snapping) and how motion is controlled for users who prefer reduced motion.

For 3D marquee and perspective, the understanding developed from general CSS perspective and transform usage to specific patterns such as Magic UI’s isometric 3D marquee (alternating column directions, hover lift) and shadcn-style 3D marquee components. The tension between visual impact and distraction emerged clearly: perspective and rotation can add depth and hierarchy but can also trigger vestibular discomfort when overused or when motion is continuous. The need to respect `prefers-reduced-motion` and to offer static or motion-reduced alternatives was consistent across sources.

For scrolling music strips, the evolution moved from “horizontal strip with one active item” to concrete UX guidance: scroll snapping to center, visual contrast between active and inactive items (scale, rotation, or overlay), progress or position indication, and keyboard/roving focus. The 8-track and Cover Flow metaphors informed the idea that direction and speed differences between two strips can improve scannability and reduce monotony.

---

## 2. Comprehensive Analysis

**Pull-to-center and spotlight patterns.** The spotlight pattern keeps all items present while centering and emphasizing one. Implementations range from simple sliders with center focus to combinations of scale, rotation, and 3D stack or fader effects. Android’s Carousel “hero” layout—one large centered item with a peek at the next—aligns well with music or show thumbnails where a single piece of content should dominate. Cover Flow’s legacy is the pull-to-center concept with 3D tilted items; modern versions often use CSS scroll-driven animations and scale/opacity instead of heavy 3D. For accessibility, center focus should be paired with scroll snapping so the focused item is the one that receives focus and is announced. Live regions (e.g. `aria-live="polite"`) should announce when the active item changes; `aria-live="assertive"` is reserved for critical, interrupting announcements. The evidence consistently supports providing a clear single “active” element in the center and avoiding multiple competing focal points.

**3D marquee and perspective.** CSS `perspective` controls the distance to the z=0 plane and gives 3D-transformed children depth. 3D marquee components (e.g. isometric galleries with alternating column directions) are recommended for high-impact landing or showcase areas, often with 8–16 items and optional hover lift. The same sources caution that parallax, continuous scroll, and strong perspective can trigger vestibular issues; hence `prefers-reduced-motion` must be honored. Best practice is to shorten or remove non-essential motion when the user requests reduced motion—for example near-instant transitions or a static layout—while keeping essential feedback (e.g. state change) minimal but present. Contradictions are few: some guidelines stress “no motion” under reduce, others “minimal duration”; the practical consensus is to make animations very short or invisible rather than removing all feedback.

**Scrolling music strips and active item contrast.** Horizontal music strips benefit from a single visually dominant “now playing” or “selected” item. Contrast can be achieved by scale (centered item larger), rotation (centered facing forward, neighbors angled), or overlay (centered card in front, strip dimmed). Scroll-driven animations can tie scale/rotation to scroll position so the 50% scroll position maps to “centered and active.” Direction and speed differentiation between two strips (e.g. one left-to-right, one right-to-left, or different durations) improves scanability and reduces the “single endless band” effect. Progress or position indicators and keyboard navigation (e.g. roving tabindex) support both sighted and assistive-technology users.

**Limitations and gaps.** Most sources are design-system or implementation guides rather than controlled studies. Vestibular impact is well documented in accessibility guidelines but less so in music-UI-specific literature. The “ideal” 3D angle or duration for marquees is not standardized; recommendations are qualitative (e.g. “subtle,” “dramatic”) and context-dependent.

---

## 3. Practical Implications

**Center-stage overlay.** Using an overlay that shows a single playing track card in the center, with the strip paused and optionally dimmed, matches the hero/spotlight pattern and keeps a single clear focus. Enter/exit animations (e.g. opacity and scale over ~0.25s) should be shortened or disabled when `prefers-reduced-motion` is set; the implementation already uses Framer Motion’s `useReducedMotion` and a shorter duration for that case. The center card should have `aria-live="polite"` and an accessible name (e.g. “Now playing: [title]”) so screen readers announce the active track when it appears or changes.

**Strip dimming.** Dimming the strip (e.g. reduced opacity) when the center-stage card is visible reinforces the hierarchy and is consistent with fader/spotlight patterns where non-active content is de-emphasized. This has been implemented as a transition to ~50% opacity on the strip when `playingId` is set.

**Jellyfin reverse direction.** Reversing the Jellyfin Music marquee relative to MNKY MUSIK provides directional contrast and supports the “two strips, different motion” guidance, improving scanability without changing functionality.

**3D and reduced motion.** The current 3D wrapper (perspective + `marquee-3d-inner` with `rotateX`/`rotateY`) should remain optional (`enable3D`). When center-stage is active, the strip is already paused; the 3D tilt can remain because the main motion (marquee scroll) is stopped. For users who prefer reduced motion, the overlay enter/exit duration is already shortened; consideration can be given to disabling or flattening the 3D transform when `prefers-reduced-motion` is set (e.g. set `transform: none` on the 3D inner container in a reduced-motion media query) so that the only motion is the minimal overlay transition.

**Duration and stagger.** Keeping MNKY MUSIK at ~70s and Jellyfin at ~80s, with opposite directions, gives enough contrast; no change is required unless product goals shift toward more or less motion.

---

## 4. Design Decisions (Summary)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **3D when center-stage is active** | Keep current 3D tilt. | Strip is paused; 3D is static during overlay. No need to remove or change 3D for center-stage. |
| **3D and prefers-reduced-motion** | Optional: flatten 3D (no rotate) when `prefers-reduced-motion`. | Reduces vestibular load while keeping layout. Can be added in globals.css or component. |
| **Dim strip when center card visible** | Yes, dim strip (e.g. opacity ~50%). | Implemented. Aligns with spotlight/fader pattern and focuses attention on center card. |
| **Marquee durations** | Keep 70s (MNKY) and 80s (Jellyfin). | Already different; reverse direction provides contrast; no change needed. |
| **Center-stage accessibility** | `aria-live="polite"` and accessible name on center card; short or no animation when reduced motion. | Implemented. Matches carousel and live-region guidance. |

---

## 5. Implementation After Research

- **Center-stage overlay:** Implemented in `MnkyMusikMarquee` with AnimatePresence, motion.div, dimmed strip, and `useReducedMotion` for duration.
- **Jellyfin reverse:** Implemented; `Marquee` receives `reverse` in Jellyfin Music section.
- **Optional 3D and reduced motion:** The project already flattens 3D when the user prefers reduced motion: in `apps/web/app/globals.css`, `.marquee-3d-inner` uses `transform: none` inside `@media (prefers-reduced-motion: reduce)`. No further change required.

---

*Report produced per the deep-thinking protocol. Themes: pull-to-center/spotlight UX, 3D marquee/perspective, scrolling music strips. Sources: Brave Search, Tavily (advanced), web.dev, MDN, design systems (Magic UI, shadcn, Android Material), accessibility (Smashing Magazine, WebAIM, Chrome for Developers, aria-live/reduced-motion).*
