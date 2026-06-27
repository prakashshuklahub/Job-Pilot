import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { DEFAULT_PRIMARY_COUNTRY_LABELS } from './market-countries';

function parseYamlList(section: string, key: string): string[] {
  const re = new RegExp(`^\\s{2}${key}:\\s*\\n((?:\\s{4}-\\s+[^\\n]+\\n)*)`, 'm');
  const match = section.match(re);
  if (!match) return [];
  return [...match[1].matchAll(/-\s+(.+)/g)].map((m) => m[1].trim().replace(/^["']|["']$/g, ''));
}

export function loadProfileCountryLists(): { primary: string[]; all: string[] } {
  const candidates = [
    path.join(process.cwd(), '..', 'config', 'profile.yml'),
    path.join(process.cwd(), 'config', 'profile.yml'),
  ];
  const file = candidates.find((p) => existsSync(p));
  if (!file) {
    return { primary: DEFAULT_PRIMARY_COUNTRY_LABELS, all: [] };
  }

  const text = readFileSync(file, 'utf8');
  const locationMatch = text.match(/^location:\s*\n([\s\S]*?)(?=^[a-z_]+:|\s*# auto_|$)/m);
  const locationSection = locationMatch?.[1] ?? text;

  const primary = parseYamlList(locationSection, 'primary_target_countries');
  const all = parseYamlList(locationSection, 'target_countries');

  return {
    primary: primary.length > 0 ? primary : DEFAULT_PRIMARY_COUNTRY_LABELS,
    all,
  };
}
