export function formatDisplayName(email?: string, savedName?: string | null): string {
  const trimmed = savedName?.trim();
  if (trimmed) return trimmed;

  const raw = email?.split('@')[0] ?? 'Learner';
  return raw
    .split(/[._-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getInitials(name: string, email?: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email?.slice(0, 2).toUpperCase() ?? '?';
}
