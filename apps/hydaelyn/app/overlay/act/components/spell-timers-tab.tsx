"use client";

/**
 * Spell timers placeholder (Ember baseline).
 * Requires LogLine listener and parsing; planned.
 */

export function SpellTimersTab() {
  return (
    <div className="mt-3 space-y-2">
      <p className="text-sm text-muted-foreground">
        Spell / buff / DOT timers — planned.
      </p>
      <p className="text-xs text-white/50">
        Will use OverlayPlugin <code className="bg-white/10 px-1 rounded">LogLine</code> events
        and parse network-format lines for ability IDs and durations.
      </p>
    </div>
  );
}
