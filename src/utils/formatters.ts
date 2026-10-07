// Helpers for formatting values

export function formatPriceLevel(level: number): string {
  switch (level) {
    case 1:
      return '$ • Econômico';
    case 2:
      return '$$ • Moderado';
    case 3:
      return '$$$ • Sofisticado';
    case 4:
      return '$$$$ • Exclusivo';
    default:
      return '$$';
  }
}

export function formatPriceSymbols(level: number): string {
  return '$'.repeat(Math.min(Math.max(level, 1), 4));
}

export function formatDistance(distanceKm?: number): string {
  if (distanceKm === undefined || distanceKm === null) return '';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateString;
  }
}
