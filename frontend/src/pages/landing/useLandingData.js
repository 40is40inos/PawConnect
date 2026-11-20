import { useEffect, useState } from 'react';
import { getKeeper, searchKeepers } from '../../api/market';

// Public data for the landing page: keepers, a few recent reviews and totals.
// Failures are silent; sections that need data simply don't render.
export function useLandingData() {
  const [state, setState] = useState({ keepers: [], reviews: [], stats: null });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const keepers = await searchKeepers().catch(() => []);
      const reviewed = [...keepers]
        .filter((k) => k.rating.count > 0)
        .sort((a, b) => b.rating.count - a.rating.count)
        .slice(0, 3);
      const pages = await Promise.all(reviewed.map((k) => getKeeper(k.userName).catch(() => null)));
      const reviews = pages
        .filter(Boolean)
        .flatMap((page) =>
          page.reviews
            .filter((r) => r.comment)
            .map((r) => ({ ...r, keeperName: page.firstName, keeperUserName: page.userName }))
        )
        .slice(0, 8);

      const reviewCount = keepers.reduce((sum, k) => sum + k.rating.count, 0);
      const stats = keepers.length
        ? {
            keepers: keepers.length,
            cities: [...new Set(keepers.map((k) => k.city))],
            reviewCount,
            average: reviewCount
              ? keepers.reduce((sum, k) => sum + k.rating.average * k.rating.count, 0) / reviewCount
              : null,
            fromRate: Math.min(...keepers.map((k) => Number(k.dailyRate))),
            species: new Set(keepers.flatMap((k) => k.acceptedSpecies)).size,
          }
        : null;

      if (!cancelled) setState({ keepers, reviews, stats });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
