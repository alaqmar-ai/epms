'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StageSchedule } from '@/lib/types';
import {
  addDays,
  dateFromX,
  daysBetween,
  durationDays,
  monthEnd,
  monthsBetween,
  monthStart,
  xFromDate,
} from '@/lib/schedule-geometry';

type BarField = 'plan' | 'actual';
type DragKind = 'move' | 'l' | 'r' | 'create';

interface DragState {
  stageId: string;
  field: BarField;
  kind: DragKind;
  origStart: string;
  origEnd: string;
  startClientX: number;
  trackLeft: number;
}
interface Preview {
  stageId: string;
  field: BarField;
  start: string;
  end: string;
}

interface Props {
  stages: StageSchedule[];
  /** view = read-only; plan = drag blue bars; actual = drag green bars. */
  mode: 'view' | 'plan' | 'actual';
  plannedStart?: string;
  plannedEnd?: string;
  /** Persist one bar's new dates on pointer-up. */
  onCommit: (
    stageId: string,
    patch: { planStart?: string; planEnd?: string; actualStart?: string; actualEnd?: string }
  ) => void;
}

const LABEL_W = 150;
const DAY_W = 12;
const ROW_H = 40;

const today = new Date().toISOString().slice(0, 10);

export default function ScheduleGrid({ stages, mode, plannedStart, plannedEnd, onCommit }: Props) {
  const sorted = useMemo(() => [...stages].sort((a, b) => a.stageIndex - b.stageIndex), [stages]);

  // ── domain (origin = month-start of earliest date; end = month-end of latest) ──
  const { origin, end, totalDays } = useMemo(() => {
    const pts: string[] = [];
    for (const s of sorted) {
      [s.planStart, s.planEnd, s.actualStart, s.actualEnd, s.baselineStart, s.baselineEnd].forEach(
        (d) => d && pts.push(d)
      );
    }
    if (plannedStart) pts.push(plannedStart);
    if (plannedEnd) pts.push(plannedEnd);
    if (pts.length === 0) {
      pts.push(today, addDays(today, 90));
    }
    pts.sort();
    const o = monthStart(pts[0]);
    const e = monthEnd(pts[pts.length - 1]);
    return { origin: o, end: e, totalDays: daysBetween(o, e) + 1 };
  }, [sorted, plannedStart, plannedEnd]);

  const trackW = totalDays * DAY_W;
  const innerW = LABEL_W + trackW;
  const bodyH = sorted.length * ROW_H;
  const months = useMemo(() => monthsBetween(origin, end), [origin, end]);

  // ── drag machinery ──
  const [drag, setDrag] = useState<DragState | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    if (!drag) return;
    // `last` tracks the live bar dates inside the effect so onUp reads the
    // latest without a component-level ref; `preview` state drives rendering.
    let last: Preview = { stageId: drag.stageId, field: drag.field, start: drag.origStart, end: drag.origEnd };
    const onMove = (e: PointerEvent) => {
      const deltaDays = Math.round((e.clientX - drag.startClientX) / DAY_W);
      let start = drag.origStart;
      let end2 = drag.origEnd;
      if (drag.kind === 'move') {
        start = addDays(drag.origStart, deltaDays);
        end2 = addDays(drag.origEnd, deltaDays);
      } else if (drag.kind === 'l') {
        start = addDays(drag.origStart, deltaDays);
        if (daysBetween(start, end2) < 0) start = end2; // min 1 day
      } else if (drag.kind === 'r') {
        end2 = addDays(drag.origEnd, deltaDays);
        if (daysBetween(start, end2) < 0) end2 = start;
      } else {
        // create: anchor = origStart; other end follows the pointer
        const cur = dateFromX(e.clientX - drag.trackLeft, origin, DAY_W);
        start = daysBetween(drag.origStart, cur) < 0 ? cur : drag.origStart;
        end2 = daysBetween(drag.origStart, cur) < 0 ? drag.origStart : cur;
      }
      last = { stageId: drag.stageId, field: drag.field, start, end: end2 };
      setPreview(last);
    };
    const onUp = () => {
      onCommit(
        last.stageId,
        last.field === 'plan'
          ? { planStart: last.start, planEnd: last.end }
          : { actualStart: last.start, actualEnd: last.end }
      );
      setDrag(null);
      setPreview(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, origin, onCommit]);

  const begin = (
    e: React.PointerEvent,
    stageId: string,
    field: BarField,
    kind: DragKind,
    origStart: string,
    origEnd: string
  ) => {
    if (mode !== field) return;
    e.preventDefault();
    e.stopPropagation();
    const trackLeft = (e.currentTarget.closest('[data-track]') as HTMLElement)?.getBoundingClientRect().left ?? 0;
    setDrag({ stageId, field, kind, origStart, origEnd, startClientX: e.clientX, trackLeft });
    setPreview({ stageId, field, start: origStart, end: origEnd });
  };

  const beginCreate = (e: React.PointerEvent, stageId: string, field: BarField) => {
    if (mode !== field) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const anchor = dateFromX(e.clientX - rect.left, origin, DAY_W);
    setDrag({ stageId, field, kind: 'create', origStart: anchor, origEnd: anchor, startClientX: e.clientX, trackLeft: rect.left });
    setPreview({ stageId, field, start: anchor, end: anchor });
  };

  // effective dates for a bar (preview override while dragging)
  const eff = (stage: StageSchedule, field: BarField): { start?: string; end?: string } => {
    if (preview && preview.stageId === stage.id && preview.field === field) {
      return { start: preview.start, end: preview.end };
    }
    return field === 'plan'
      ? { start: stage.planStart, end: stage.planEnd }
      : { start: stage.actualStart, end: stage.actualEnd };
  };

  const editable = mode !== 'view';

  return (
    <div className="bg-white border border-border rounded-2xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ width: innerW }} className="relative select-none">
          {/* header: months + day ticks */}
          <div className="flex" style={{ height: 40 }}>
            <div
              className="sticky left-0 z-20 bg-elevated border-r border-border flex items-end px-3 py-1.5"
              style={{ width: LABEL_W, minWidth: LABEL_W }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Stage</span>
            </div>
            <div data-track className="relative bg-elevated/60" style={{ width: trackW }}>
              {months.map((m) => (
                <div
                  key={m.start}
                  className="absolute top-0 h-full border-l border-border flex items-start"
                  style={{ left: xFromDate(m.start, origin, DAY_W) }}
                >
                  <span className="text-[10px] font-semibold text-text-secondary px-1.5 py-1 whitespace-nowrap">
                    {m.label}
                  </span>
                </div>
              ))}
              {/* day-of-month ticks every 7 days */}
              {Array.from({ length: Math.ceil(totalDays / 7) }, (_, i) => {
                const d = addDays(origin, i * 7);
                return (
                  <span
                    key={d}
                    className="absolute bottom-0.5 text-[8px] text-text-muted font-mono"
                    style={{ left: xFromDate(d, origin, DAY_W) + 1 }}
                  >
                    {Number(d.slice(8, 10))}
                  </span>
                );
              })}
            </div>
          </div>

          {/* body */}
          <div className="relative" style={{ height: bodyH }}>
            {sorted.map((stage, i) => {
              const plan = eff(stage, 'plan');
              const actual = eff(stage, 'actual');
              const hasPlan = !!plan.start && !!plan.end;
              const hasActual = !!actual.start && !!actual.end;
              const baseDrift =
                stage.baselineStart &&
                stage.baselineEnd &&
                (stage.baselineStart !== stage.planStart || stage.baselineEnd !== stage.planEnd);
              const overrun = hasPlan && hasActual && daysBetween(plan.end!, actual.end!) > 0;
              // empty row in an edit mode → click-drag to create that bar
              const emptyRow = editable && !(mode === 'plan' ? hasPlan : hasActual);
              // red overrun starts at plan-end+1, or the actual's own start if it began after plan ended
              const redStart = overrun
                ? daysBetween(actual.start!, plan.end!) > 0
                  ? actual.start!
                  : addDays(plan.end!, 1)
                : undefined;

              return (
                <div key={stage.id} className="flex absolute left-0 right-0" style={{ top: i * ROW_H, height: ROW_H }}>
                  {/* label */}
                  <div
                    className="sticky left-0 z-20 bg-white border-r border-t border-border flex items-center px-3"
                    style={{ width: LABEL_W, minWidth: LABEL_W }}
                  >
                    <span className="text-[11px] text-text-primary truncate">
                      <span className="text-text-muted font-mono mr-1.5">{stage.stageIndex + 1}</span>
                      {stage.stageName}
                    </span>
                  </div>

                  {/* track */}
                  <div
                    data-track
                    className="relative border-t border-border"
                    style={{
                      width: trackW,
                      backgroundImage: `repeating-linear-gradient(90deg,#F1F5F9 0 1px,transparent 1px ${DAY_W}px)`,
                      cursor: emptyRow ? 'crosshair' : 'default',
                    }}
                    onPointerDown={(e) => {
                      if (emptyRow) beginCreate(e, stage.id, mode as BarField);
                    }}
                  >
                    {/* today line */}
                    {daysBetween(origin, today) >= 0 && daysBetween(today, end) >= 0 && (
                      <div className="absolute top-0 bottom-0 w-[2px] bg-amber-500/70 z-[1]" style={{ left: xFromDate(today, origin, DAY_W) }} />
                    )}

                    {/* ghost baseline (original plan) — only when plan drifted */}
                    {baseDrift && (
                      <div
                        className="absolute rounded-[5px]"
                        style={{
                          left: xFromDate(stage.baselineStart!, origin, DAY_W),
                          width: durationDays(stage.baselineStart!, stage.baselineEnd!) * DAY_W,
                          top: 6,
                          height: 9,
                          background: 'repeating-linear-gradient(45deg,#CBD5E1 0 3px,#E2E8F0 3px 6px)',
                          border: '1px dashed #94A3B8',
                          opacity: 0.7,
                        }}
                        title={`Original plan: ${stage.baselineStart} → ${stage.baselineEnd}`}
                      />
                    )}

                    {/* plan bar */}
                    {hasPlan && (
                      <Bar
                        color="#2563EB"
                        left={xFromDate(plan.start!, origin, DAY_W)}
                        width={durationDays(plan.start!, plan.end!) * DAY_W}
                        top={6}
                        title={`Plan: ${plan.start} → ${plan.end} · ${durationDays(plan.start!, plan.end!)}d`}
                        draggable={mode === 'plan'}
                        onBegin={(kind, e) => begin(e, stage.id, 'plan', kind, plan.start!, plan.end!)}
                      />
                    )}

                    {/* actual bar: full span is the draggable green bar; the
                        portion past plan-end gets a red overlay (non-interactive
                        so the whole actual stays draggable). */}
                    {hasActual && (
                      <>
                        <Bar
                          color="#10B981"
                          left={xFromDate(actual.start!, origin, DAY_W)}
                          width={durationDays(actual.start!, actual.end!) * DAY_W}
                          top={22}
                          title={`Actual: ${actual.start} → ${actual.end} · ${durationDays(actual.start!, actual.end!)}d`}
                          draggable={mode === 'actual'}
                          onBegin={(kind, e) => begin(e, stage.id, 'actual', kind, actual.start!, actual.end!)}
                        />
                        {overrun && redStart && (
                          <div
                            className="absolute rounded-r-[5px] z-[3] pointer-events-none"
                            style={{
                              left: xFromDate(redStart, origin, DAY_W),
                              width: durationDays(redStart, actual.end!) * DAY_W,
                              top: 22,
                              height: 10,
                              background: '#EF4444',
                            }}
                            title={`Ran over plan by ${daysBetween(plan.end!, actual.end!)}d`}
                          />
                        )}
                      </>
                    )}

                    {/* live date chip while dragging this row */}
                    {preview && preview.stageId === stage.id && (
                      <div
                        className="absolute z-30 text-[9px] font-semibold text-primary bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none"
                        style={{ left: xFromDate(preview.start, origin, DAY_W), top: -4 }}
                      >
                        {preview.start} → {preview.end} · {durationDays(preview.start, preview.end)}d
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function Bar({
  color,
  left,
  width,
  top,
  title,
  draggable,
  onBegin,
}: {
  color: string;
  left: number;
  width: number;
  top: number;
  title: string;
  draggable: boolean;
  onBegin: (kind: DragKind, e: React.PointerEvent) => void;
}) {
  return (
    <div
      className="absolute rounded-[5px] z-[2] flex items-center"
      style={{ left, width, top, height: 10, background: color, cursor: draggable ? 'grab' : 'default' }}
      title={title}
      onPointerDown={draggable ? (e) => onBegin('move', e) : undefined}
    >
      {draggable && (
        <>
          <span
            className="absolute -left-[3px] top-[-3px] w-[7px] h-[16px] rounded bg-black/25 hover:bg-black/40"
            style={{ cursor: 'ew-resize' }}
            onPointerDown={(e) => onBegin('l', e)}
          />
          <span
            className="absolute -right-[3px] top-[-3px] w-[7px] h-[16px] rounded bg-black/25 hover:bg-black/40"
            style={{ cursor: 'ew-resize' }}
            onPointerDown={(e) => onBegin('r', e)}
          />
        </>
      )}
    </div>
  );
}
