'use client';

import { Stage } from '@/lib/types';

interface StageRowProps {
  index: number;
  stage: Stage;
  onChange: (stage: Stage) => void;
}

export default function StageRow({ index, stage, onChange }: StageRowProps) {
  const update = (field: keyof Stage, value: string | boolean) => {
    onChange({ ...stage, [field]: value });
  };

  const inputClass = "bg-midnight border border-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-eng transition-colors w-full";

  return (
    <tr className="border-t border-border hover:bg-card/50 transition-colors">
      <td className="px-2 py-1.5 text-xs text-text-muted font-mono text-center w-8">{index + 1}</td>
      <td className="px-2 py-1.5 text-xs text-text-primary whitespace-nowrap">{stage.stageName}</td>
      <td className="px-2 py-1.5">
        <input type="date" value={stage.planStart} onChange={(e) => update('planStart', e.target.value)} className={inputClass} />
      </td>
      <td className="px-2 py-1.5">
        <input type="date" value={stage.planFinish} onChange={(e) => update('planFinish', e.target.value)} className={inputClass} />
      </td>
      <td className="px-2 py-1.5">
        <input type="date" value={stage.actualStart} onChange={(e) => update('actualStart', e.target.value)} className={inputClass} />
      </td>
      <td className="px-2 py-1.5">
        <input type="date" value={stage.actualFinish} onChange={(e) => update('actualFinish', e.target.value)} className={inputClass} />
      </td>
      <td className="px-2 py-1.5 text-center">
        <input
          type="checkbox"
          checked={stage.checked}
          onChange={(e) => update('checked', e.target.checked)}
          className="w-4 h-4 accent-success cursor-pointer"
        />
      </td>
    </tr>
  );
}
