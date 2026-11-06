import { POSITIONS_PER_PAGE } from './worksheet-layout';
import {
  levelExercises,
  worksheetLevels,
  type WorksheetCatalog,
  type WorksheetLevel,
  type WorksheetTopic,
} from './worksheet';
import type { WorksheetSectionDraft } from './worksheet-review';

export type WorksheetTopicDraft = { id: number; topic: string; count: string };
export function availableWorksheetLevels(
  topic: string,
  levels: WorksheetLevel[],
  catalog: WorksheetCatalog
) {
  return worksheetLevels.filter(
    (level) =>
      levels.includes(level) &&
      levelExercises(catalog[topic] ?? [], level).length >= POSITIONS_PER_PAGE
  );
}
export function eligibleWorksheetTopics(
  topics: WorksheetTopic[],
  levels: WorksheetLevel[],
  catalog: WorksheetCatalog
) {
  return topics.filter(
    (topic) => availableWorksheetLevels(topic.id, levels, catalog).length > 0
  );
}
export const defaultWorksheetCount = String(POSITIONS_PER_PAGE);
export function expandWorksheetTopics(
  rows: WorksheetTopicDraft[],
  levels: WorksheetLevel[],
  catalog: WorksheetCatalog
): WorksheetSectionDraft[] {
  return rows.flatMap((row) =>
    availableWorksheetLevels(row.topic, levels, catalog).map((level) => ({
      ...row,
      id: row.id * 10 + worksheetLevels.indexOf(level),
      topicGroupId: row.id,
      level,
    }))
  );
}
