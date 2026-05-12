/**
 * Maps category icon_identifier values stored in the database to valid
 * Material Symbols icon names. Some legacy or shorthand identifiers like
 * 'other' are not valid Material Symbol names and need to be remapped.
 */
const ICON_ALIAS_MAP: Record<string, string> = {
  other: "category",
  others: "category",
};

/**
 * Resolves a raw icon_identifier from the categories table to a valid
 * Material Symbols icon name, falling back to `fallback` if absent.
 *
 * @example
 * resolveIcon('other')         // → 'category'
 * resolveIcon('vpn_key')       // → 'vpn_key'
 * resolveIcon(null)            // → 'help_outline'
 * resolveIcon(null, 'inventory_2') // → 'inventory_2'
 */
export function resolveIcon(
  iconIdentifier: string | null | undefined,
  fallback = "help_outline"
): string {
  if (!iconIdentifier) return fallback;
  return ICON_ALIAS_MAP[iconIdentifier.toLowerCase()] ?? iconIdentifier;
}
