import { Activity, Lesson, uid } from './lessons';

const content = ({ id, tier, ...rest }: Activity) => {
  void id;
  void tier;
  return JSON.stringify(rest);
};

export function suggestedTarget(existing: Lesson[], incoming: Lesson): string {
  if (existing.some((l) => l.id === incoming.id)) return incoming.id;
  const key = (l: Lesson) =>
    [l.title, l.topic, l.level].map((v) => v.trim().toLowerCase()).join('\n');
  const matches = existing.filter((l) => key(l) === key(incoming));
  return matches.length === 1 ? matches[0].id : '';
}

export function reviseLesson(previous: Lesson, incoming: Lesson): Lesson {
  const unused = [...previous.activities];
  return {
    ...incoming,
    id: previous.id,
    revision: (previous.revision || 1) + 1,
    activities: incoming.activities.map((a) => {
      const index = unused.findIndex((old) => content(old) === content(a));
      const id = index >= 0 ? unused.splice(index, 1)[0].id : uid();
      return { ...a, id };
    }),
  };
}

/** Build the full result before writing anything. Every update has an explicit target. */
export function applyLessonImport(
  existing: Lesson[],
  incoming: Lesson[],
  targets: Record<string, string>
): Lesson[] {
  const result = [...existing];
  const used = new Set<string>();
  for (const lesson of incoming) {
    const target = targets[lesson.id];
    if (!target) {
      result.push({
        ...lesson,
        id: uid(),
        revision: 1,
        activities: lesson.activities.map((a) => ({ ...a, id: uid() })),
      });
    } else {
      if (used.has(target))
        throw new Error('Choose a different update target for each lesson.');
      const index = existing.findIndex((l) => l.id === target);
      if (index < 0)
        throw new Error('The lesson to update is no longer available.');
      used.add(target);
      result[index] = reviseLesson(existing[index], lesson);
    }
  }
  if (result.length > 100)
    throw new Error('The library supports up to 100 lessons.');
  return result;
}
