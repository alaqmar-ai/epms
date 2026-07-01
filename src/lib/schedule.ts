// Pure recipient logic for schedule-change notifications, kept separate so it
// can be reasoned about (and unit-tested) without a DB.

/**
 * Who to notify when a submitted plan is amended: the sub-project PIC plus the
 * overseer(s), minus whoever made the edit (no self-pings), deduped.
 */
export function computeScheduleRecipients(input: {
  picId: string | null;
  overseerIds: string[];
  editorId: string;
}): string[] {
  const set = new Set<string>();
  if (input.picId) set.add(input.picId);
  for (const id of input.overseerIds) set.add(id);
  set.delete(input.editorId);
  return Array.from(set);
}
