import type { Opportunity } from '@/types/domain';
import { OpportunityCard } from './opportunity-card';

export function OpportunityGrid({ items }: { items: Opportunity[] }) {
  if (!items.length) {
    return <p className="py-12 text-center text-muted-foreground">No results.</p>;
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((o) => (
        <OpportunityCard key={o.id} opportunity={o} />
      ))}
    </div>
  );
}
