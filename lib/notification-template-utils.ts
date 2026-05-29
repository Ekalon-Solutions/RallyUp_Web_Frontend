export type NotificationChannel = 'email' | 'in_app';

export const CHANNEL_CHAR_LIMITS: Record<NotificationChannel, { subject?: number; body: number }> = {
  in_app: { subject: 65, body: 256 },
  email: { subject: 120, body: 8000 },
};

export const VARIABLE_CATEGORIES = {
  member: {
    label: 'Member Data',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
    variables: ['member_name', 'member_email'] as const,
  },
  event: {
    label: 'Event Data',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
    variables: ['event_title', 'venue_name', 'event_date', 'ticket_id', 'ticket_link'] as const,
  },
  club: {
    label: 'Club Data',
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
    variables: ['club_name', 'refund_policy_note'] as const,
  },
} as const;

export const VARIABLE_SAMPLE_DATA: Record<string, string> = {
  member_name: 'Soham',
  member_email: 'soham@example.com',
  event_title: 'Derby Day Screening',
  venue_name: 'North Stand Lounge',
  event_date: 'Sat, 14 Jun · 7:00 PM',
  ticket_id: 'TKT-48291',
  club_name: 'Demo Club',
  refund_policy_note: 'This event is non-refundable.',
  ticket_link: 'https://wingmanpro.tech/t/abc123',
};

export const KNOWN_VARIABLES = new Set(Object.keys(VARIABLE_SAMPLE_DATA));

export const BANNED_KEYWORDS = ['free money', 'click here now', 'guaranteed winner'];

export const COMMON_EMOJIS = ['👋', '🎉', '🎫', '⚽', '🏟️', '🔔', '✅', '❤️', '📅', '🕐', '🙌', '⭐'];

export interface SyntaxIssue {
  start: number;
  end: number;
  text: string;
  message: string;
  kind: 'error' | 'unknown';
}

export function sanitizePlainText(input: string): string {
  if (!input) return '';
  let text = input.replace(/<[^>]*>/g, '');
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return text;
}

export function findSyntaxIssues(text: string): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  if (!text) return issues;

  const stack: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{' && text[i + 1] === '{') {
      stack.push(i);
      i++;
    } else if (text[i] === '}' && text[i + 1] === '}') {
      if (stack.length === 0) {
        issues.push({ start: i, end: i + 2, text: '}}', message: 'Unexpected closing }}', kind: 'error' });
      } else {
        const open = stack.pop()!;
        const inner = text.slice(open + 2, i);
        if (!/^[a-zA-Z0-9_]+$/.test(inner)) {
          issues.push({
            start: open,
            end: i + 2,
            text: text.slice(open, i + 2),
            message: 'Invalid variable name',
            kind: 'error',
          });
        } else if (!KNOWN_VARIABLES.has(inner)) {
          issues.push({
            start: open,
            end: i + 2,
            text: text.slice(open, i + 2),
            message: `Unknown variable "{{${inner}}}"`,
            kind: 'unknown',
          });
        }
      }
      i++;
    } else if (text[i] === '{' || text[i] === '}') {
      const start = i;
      let end = i + 1;
      while (end < text.length && (text[end] === '{' || text[end] === '}')) end++;
      issues.push({
        start,
        end,
        text: text.slice(start, end),
        message: 'Malformed variable brackets',
        kind: 'error',
      });
      i = end - 1;
    }
  }

  for (const open of stack) {
    issues.push({ start: open, end: open + 2, text: '{{', message: 'Unclosed {{', kind: 'error' });
  }

  return issues;
}

export function computeVariableDensity(text: string): number {
  if (!text.length) return 0;
  const matches = text.match(/\{\{[a-zA-Z0-9_]+\}\}/g) ?? [];
  const variableChars = matches.reduce((sum, m) => sum + m.length, 0);
  return variableChars / text.length;
}

export interface ValidationResult {
  valid: boolean;
  compliant: boolean;
  errors: string[];
  warnings: string[];
  syntaxIssues: SyntaxIssue[];
}

export function validateTemplateText(params: {
  channel: NotificationChannel;
  subject?: string;
  body: string;
}): ValidationResult {
  const limits = CHANNEL_CHAR_LIMITS[params.channel];
  const errors: string[] = [];
  const warnings: string[] = [];

  const body = sanitizePlainText(params.body);
  const subject = params.subject !== undefined ? sanitizePlainText(params.subject) : undefined;

  const syntaxIssues = [
    ...(subject ? findSyntaxIssues(subject) : []),
    ...findSyntaxIssues(body),
  ];

  const hasErrors = syntaxIssues.some((i) => i.kind === 'error');
  if (hasErrors) errors.push('Fix variable syntax before saving.');

  if (subject !== undefined && limits.subject && subject.length > limits.subject) {
    errors.push(`Subject exceeds ${limits.subject} characters.`);
  }
  if (body.length > limits.body) {
    errors.push(`Body exceeds ${limits.body} characters.`);
  }

  const combined = `${subject ?? ''} ${body}`.toLowerCase();
  for (const banned of BANNED_KEYWORDS) {
    if (combined.includes(banned)) errors.push(`Banned phrase: "${banned}".`);
  }

  if (computeVariableDensity(body) > 0.5) {
    errors.push('More than 50% of the message is variables.');
  }

  const valid = errors.length === 0;
  return { valid, compliant: valid && warnings.length === 0, errors, warnings, syntaxIssues };
}

export function mapSampleVariables(text: string): string {
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_full, key: string) => {
    if (!KNOWN_VARIABLES.has(key)) return '';
    return VARIABLE_SAMPLE_DATA[key] ?? '';
  });
}

export function insertAtCursor(
  value: string,
  insertion: string,
  selectionStart: number,
  selectionEnd: number
): { next: string; cursor: number } {
  const next = value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
  const cursor = selectionStart + insertion.length;
  return { next, cursor };
}

export function buildHighlightedSegments(text: string, issues: SyntaxIssue[]) {
  if (!text) return [{ text: '', className: '' }];
  const sorted = [...issues].sort((a, b) => a.start - b.start);
  const segments: { text: string; className: string }[] = [];
  let cursor = 0;

  for (const issue of sorted) {
    if (issue.start > cursor) {
      segments.push({ text: text.slice(cursor, issue.start), className: '' });
    }
    segments.push({
      text: text.slice(issue.start, issue.end),
      className: issue.kind === 'unknown' ? 'bg-yellow-200 dark:bg-yellow-900' : 'bg-red-200 dark:bg-red-900',
    });
    cursor = issue.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), className: '' });
  }

  return segments;
}
