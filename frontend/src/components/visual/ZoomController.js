import { useEffect } from "react";

/**
 * --------------------------------------------------------
 * Zoom Controller
 * --------------------------------------------------------
 * Automatically centers the selected issue inside the
 * scrollable viewer.
 *
 * Future:
 *  - Zoom In / Out
 *  - Animated transitions
 *  - Fit to screen
 *  - Keyboard navigation
 * --------------------------------------------------------
 */

export function useZoomController({
  viewerRef,
  selectedIssue,
  scale = 1,
  padding = 150,
}) {
  useEffect(() => {
    if (!selectedIssue) return;
    if (!viewerRef.current) return;

    const container = viewerRef.current;

    const {
      x,
      y,
      width,
      height,
    } = selectedIssue.location;

    // Issue center
    const centerX = (x + width / 2) * scale;
    const centerY = (y + height / 2) * scale;

    // Scroll position
    const scrollLeft =
      centerX - container.clientWidth / 2;

    const scrollTop =
      centerY - container.clientHeight / 2;

    container.scrollTo({
      left: Math.max(scrollLeft - padding, 0),
      top: Math.max(scrollTop - padding, 0),
      behavior: "smooth",
    });
  }, [
    selectedIssue,
    viewerRef,
    scale,
    padding,
  ]);
}