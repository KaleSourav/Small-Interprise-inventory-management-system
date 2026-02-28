'use client';

import { useMemo } from 'react';
import type { NavItem } from '@/types';

export function useFilteredNavItems(items: NavItem[]) {
  const filteredItems = useMemo(() => {
    return items.map((item) => item);
  }, [items]);

  return filteredItems;
}
