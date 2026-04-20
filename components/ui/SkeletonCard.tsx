'use client';
// components/ui/SkeletonCard.tsx
export default function SkeletonCard({ height = 100 }: { height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ height, borderRadius: '16px', width: '100%' }}
    />
  );
}

export function SkeletonText({ width = '60%', height = 14 }: { width?: string; height?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: '6px' }}
    />
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} height={160} />
      ))}
    </div>
  );
}
