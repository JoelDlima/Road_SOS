/**
 * Shared layout constants. Importing screens use these to calculate
 * `paddingBottom` so content never sits behind the floating tab bar
 * or the chat input docked above it.
 */

/** Pixel height of the floating bottom tab bar. */
export const TAB_HEIGHT = 68;

/** Distance between the bottom safe area and the tab bar. */
export const TAB_BOTTOM_OFFSET = 12;

/**
 * Total vertical space the tab bar visually occupies (including its offset
 * from the safe area). Add `insets.bottom` and a breathing margin on top.
 */
export const TAB_BAR_TOTAL = TAB_HEIGHT + TAB_BOTTOM_OFFSET;

/**
 * Recommended `paddingBottom` for ScrollView content inside a tabbed screen.
 * Pass `insets.bottom` to clear the home indicator on iOS.
 */
export function tabContentPaddingBottom(insetsBottom: number, extra: number = 24): number {
  return TAB_BAR_TOTAL + insetsBottom + extra;
}
