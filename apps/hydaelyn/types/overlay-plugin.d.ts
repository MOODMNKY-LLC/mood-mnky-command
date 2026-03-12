/**
 * OverlayPlugin (ngld) common.min.js globals.
 * @see https://ngld.github.io/OverlayPlugin/devs/
 */
declare function addOverlayListener(
  event: string,
  callback: (data: unknown) => void
): void;
declare function removeOverlayListener(
  event: string,
  callback: (data: unknown) => void
): void;
declare function startOverlayEvents(): void;
