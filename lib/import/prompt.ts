/**
 * Claude prompt for the CSV import (Mode 1 and Mode 2 both use this text, so the
 * manual paste flow and the API flow cannot drift apart).
 *
 * Takes plain shapes rather than mock types, so it works for the demo projects
 * and for real Supabase rows.
 */
export type PromptProject = { key: string; name: string };
export type PromptSprint = {
  name: string;
  start_date: string;
  end_date: string;
  goal?: string | null;
};
export type PromptMember = { name: string; role?: string };

export function buildClaudePrompt(args: {
  project: PromptProject;
  sprint: PromptSprint | null;
  members: PromptMember[];
  csv: string;
}): string {
  const { project, sprint, members, csv } = args;
  const memberLines = members
    .map((m) => `- ${m.name}${m.role ? ` (${m.role.replace('_', ' ')})` : ''}`)
    .join('\n');
  const sprintLine = sprint
    ? `${sprint.name} · ${sprint.start_date} → ${sprint.end_date}${sprint.goal ? ` · Goal: ${sprint.goal}` : ''}`
    : 'No active sprint — import into backlog.';

  return `You are NEXUS Import Assistant. Read the CSV below and produce STRICT JSON that
matches the schema. Return ONLY the JSON object — no markdown, no preamble, no
comments.

PROJECT: ${project.name} (key: ${project.key})
SPRINT:  ${sprintLine}

TEAM:
${memberLines || '- (no members listed)'}

STORY POINT OPTIONS: 1, 2, 3, 5, 8, 13, 21 (use 0 for unknown).

JSON SCHEMA:
{
  "tasks": [
    {
      "title":        string,                                       // <= 200 chars, required
      "description":  string,                                       // <= 2000 chars, default ""
      "type":         "feature" | "bug" | "chore" | "spike" | "epic",
      "priority":     "low" | "medium" | "high" | "critical",
      "story_points": number,                                       // one of the options above
      "assignee":     string | null,                                // must match a TEAM member name exactly
      "due_date":     "YYYY-MM-DD" | null
    }
  ]
}

RULES:
- Use the exact spellings from the TEAM list for "assignee". Use null if unclear.
- Infer sensible "type" / "priority" from the CSV row. Default to feature / medium.
- Default story_points to your best estimate from the description. Use 0 only if no
  information is available.
- Trim whitespace. Strip surrounding quotes.
- Do NOT include extra fields. Do NOT wrap output in code fences.

CSV:
\`\`\`
${csv}
\`\`\`

Return the JSON now.`;
}
