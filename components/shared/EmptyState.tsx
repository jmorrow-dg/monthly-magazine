'use client';

export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-[#222222] border border-[#333333] flex items-center justify-center mb-4">
        <span className="text-[#666666] text-lg">0</span>
      </div>
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      {description && <p className="text-[#888888] text-sm">{description}</p>}
    </div>
  );
}
