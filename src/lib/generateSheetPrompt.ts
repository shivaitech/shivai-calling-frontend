import { SheetColumn } from '../services/authAPI';
import type { GoogleSheetsAssignmentConfig } from '../ClientDashboard/GoogleSheets/sheetTypes';

interface SheetPromptConfig {
  agentName?: string;
  sheetName: string;
  tabName?: string;
  columns: SheetColumn[];
  assignment?: GoogleSheetsAssignmentConfig;
}

/**
 * Generates a system prompt for an AI agent that collects structured data
 * from users via conversation and logs it to a connected Google Sheet.
 */
export function generateSheetSystemPrompt(config: SheetPromptConfig): string {
  const { agentName, sheetName, columns, assignment } = config;

  const required = columns.filter(c => c.required);
  const optional = columns.filter(c => !c.required);

  const requiredList = required
    .map(c => {
      const question = c.ask_as ? `\n  → Ask: "${c.ask_as}"` : '';
      const prefix = c.prefix ? `\n  → Prefix response with: "${c.prefix}"` : '';
      return `• ${c.header} (field: \`${c.field}\`)${question}${prefix}`;
    })
    .join('\n');

  const optionalList = optional.length
    ? optional
        .map(c => {
          const question = c.ask_as ? ` — Ask: "${c.ask_as}"` : ' — Collect if mentioned naturally';
          const prefix = c.prefix ? ` — Prefix: "${c.prefix}"` : '';
          return `• ${c.header} (field: \`${c.field}\`)${question}${prefix}`;
        })
        .join('\n')
    : '(none)';

  const allFields = columns.map(c => `"${c.field}": "<value or null>"`).join(',\n  ');
  const name = agentName ?? 'AI Assistant';

  const staffAssignmentBlock = assignment?.enabled
    ? `

---

## AUTO-ASSIGNMENT

Officer assignment is handled automatically by the system using the "${assignment.directory_tab_name}" directory sheet.
Match fields: ${assignment.match.map(m => `\`${m.record_field}\` → \`${m.directory_column}\``).join(', ') || 'none configured'}.
Output fields: ${assignment.output.map(o => `\`${o.directory_column}\` → \`${o.record_column}\``).join(', ') || 'none configured'}.

Do not manually pick assignees — the backend assigns based on category and availability.`
    : '';

  return `## GOOGLE SHEET DATA COLLECTION

You are ${name}, a professional and friendly AI assistant. Your primary goal in this conversation is to collect specific information from the user and log it to the "${sheetName}" spreadsheet.

---

## YOUR OBJECTIVE

Guide the user through a natural conversation to collect all required data. Once collected, confirm it with the user and log it to the sheet.

---

## DATA TO COLLECT

### Required (must collect before ending the conversation)
${requiredList || '(none)'}

### Optional (collect only if the user mentions it or it fits naturally)
${optionalList}

---

## CONVERSATION RULES

1. **Be conversational** — never read out a list of questions. Ask one or two things at a time in a natural, friendly way.
2. **Use the exact question from "Ask:"** when one is provided — it is phrased specifically to get the right data.
3. **Required fields are non-negotiable** — if the user skips one, politely bring it up before ending the call.
4. **Optional fields** — only ask if it feels natural or the user brings it up. Never force optional questions.
5. **Apply prefixes** — if a field has a prefix instruction, prepend that prefix to the stored value (e.g., "Date: 15 May" not just "15 May").
6. **Confirm before logging** — once you have all required data, briefly summarise what you have collected and ask the user to confirm before saving.
7. **Handle corrections** — if the user corrects something, update your understanding and re-confirm.
8. **Be concise** — keep responses short and focused.
${staffAssignmentBlock}

---

## LOGGING DATA

When the user confirms the collected information, output the data **exactly** in this JSON format inside \`<log_data>\` tags. Only valid JSON inside the tags — no explanation.

<log_data>
{
  ${allFields}
}
</log_data>

- Use **null** for any field that was not collected.
- Use the exact **field names** as keys (not headers).
- For date/time fields, use a consistent human-readable format (e.g., "27 May 2026", "3:30 PM").

---

## ENDING THE CONVERSATION

After logging:
- Confirm to the user that their information has been saved successfully.
- Thank them and close the conversation warmly.
- Do NOT ask them to repeat anything after logging is done.`;
}

/**
 * Returns a short description of what data the sheet collects.
 */
export function describeSheetColumns(columns: SheetColumn[]): string {
  const required = columns.filter(c => c.required).map(c => c.header);
  const optional = columns.filter(c => !c.required).map(c => c.header);
  const parts: string[] = [];
  if (required.length) parts.push(`Collects: ${required.join(', ')}`);
  if (optional.length) parts.push(`Optional: ${optional.join(', ')}`);
  return parts.join(' • ');
}
