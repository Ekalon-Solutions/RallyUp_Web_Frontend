export type NotificationChannel = 'email' | 'in_app';

// Sentinel returned by mapSampleVariables for {{qr_code}}.
// The preview component detects this and renders a QR image in the phone mockup.
export const QR_PREVIEW_SENTINEL = '\x00QR\x00';

export const CHANNEL_CHAR_LIMITS: Record<NotificationChannel, { subject?: number; body: number }> = {
  in_app: { subject: 65, body: 256 },
  email: { subject: 120, body: 8000 },
};

// ── Variable categories (chip bar) ────────────────────────────────────────────

export const VARIABLE_CATEGORIES = {
  member: {
    label: 'Member Data',
    color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
    variables: ['member_name', 'member_email'] as const,
  },
  event: {
    label: 'Event Data',
    color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-800',
    variables: ['event_title', 'venue_name', 'event_date', 'ticket_id', 'ticket_link', 'qr_code'] as const,
  },
  club: {
    label: 'Club Data',
    color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
    variables: ['club_name', 'refund_policy_note'] as const,
  },
  order: {
    label: 'Order / Commerce',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800',
    variables: ['order_id'] as const,
  },
  content: {
    label: 'Content',
    color: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800',
    variables: ['news_title', 'album_name', 'poll_question', 'item_name'] as const,
  },
  membership: {
    label: 'Membership',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800',
    variables: ['expiry_date', 'new_expiry_date'] as const,
  },
  system: {
    label: 'System alerts',
    color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-200 dark:border-red-800',
    variables: ['usage_percent', 'used_gb', 'total_gb', 'reason'] as const,
  },
} as const;

// ── Variable sample data (preview substitution) ───────────────────────────────

export const VARIABLE_SAMPLE_DATA: Record<string, string> = {
  // Member
  member_name: 'Soham',
  member_email: 'soham@example.com',
  // Event
  event_title: 'Derby Day Screening',
  venue_name: 'North Stand Lounge',
  event_date: 'Sat, 14 Jun · 7:00 PM',
  ticket_id: 'TKT-48291',
  ticket_link: 'https://wingmanpro.tech/t/abc123',
  qr_code: QR_PREVIEW_SENTINEL,
  // Club
  club_name: 'Demo Club',
  refund_policy_note: 'This event is non-refundable.',
  // Order / Commerce
  order_id: 'ORD-28471',
  // Content
  news_title: 'Matchday Preview: Upcoming Derby',
  album_name: 'Derby Day Highlights',
  poll_question: 'Who was the star player this month?',
  item_name: 'Home Kit 2025',
  // Membership
  expiry_date: '31 Jul 2025',
  new_expiry_date: '31 Jul 2026',
  // System / Storage
  usage_percent: '85.5',
  used_gb: '8.55',
  total_gb: '10.00',
  reason: 'Usage Exceeded',
};

export const KNOWN_VARIABLES = new Set(Object.keys(VARIABLE_SAMPLE_DATA));

// Privacy-restricted variables — match backend PRIVACY_RESTRICTED set.
// These are valid known variables but BLANKED at send-time to comply with
// privacy standards. In the preview they render as '[redacted]' so admins
// can see the variable will be removed from the live message.
export const PRIVACY_RESTRICTED_VARIABLES = new Set(['member_email', 'phone_number']);

export const BANNED_KEYWORDS = ['free money', 'click here now', 'guaranteed winner'];

export const COMMON_EMOJIS = ['👋', '🎉', '🎫', '⚽', '🏟️', '🔔', '✅', '❤️', '📅', '🕐', '🙌', '⭐'];

// ── Syntax issue types ────────────────────────────────────────────────────────

export interface SyntaxIssue {
  start: number;
  end: number;
  text: string;
  message: string;
  kind: 'error' | 'unknown' | 'privacy';
}

// ── Sanitization ──────────────────────────────────────────────────────────────

export function sanitizePlainText(input: string): string {
  if (!input) return '';
  let text = input.replace(/<[^>]*>/g, '');
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  return text;
}

// ── Syntax checker ────────────────────────────────────────────────────────────
// Detects three problem classes:
//   'error'   — malformed brackets or invalid variable names → blocks save
//   'unknown' — syntactically valid but not in the variable library → yellow
//   'privacy' — known but restricted at send-time (blanked) → orange

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
            start: open, end: i + 2,
            text: text.slice(open, i + 2),
            message: 'Invalid variable name',
            kind: 'error',
          });
        } else if (PRIVACY_RESTRICTED_VARIABLES.has(inner)) {
          issues.push({
            start: open, end: i + 2,
            text: text.slice(open, i + 2),
            message: `"${inner}" is privacy-restricted — blanked in sent messages`,
            kind: 'privacy',
          });
        } else if (!KNOWN_VARIABLES.has(inner)) {
          issues.push({
            start: open, end: i + 2,
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
        start, end,
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

// ── Variable density ──────────────────────────────────────────────────────────

export function computeVariableDensity(text: string): number {
  if (!text.length) return 0;
  const matches = text.match(/\{\{[a-zA-Z0-9_]+\}\}/g) ?? [];
  if (matches.length === 0) return 0;
  // Strip all variable tokens to measure purely static text
  const staticText = text.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '');
  const staticLen = staticText.length;
  // Each variable token expands to ~10 chars on average at send-time.
  // Use the token count (not brace-included char length) to estimate
  // how much of the final rendered message will be variable content.
  const estimatedVariableLen = matches.length * 10;
  const estimatedTotal = staticLen + estimatedVariableLen;
  if (estimatedTotal === 0) return 1; // body is nothing but variables
  return estimatedVariableLen / estimatedTotal;
}

// ── Validation ────────────────────────────────────────────────────────────────

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

  const hasPrivacy = syntaxIssues.some((i) => i.kind === 'privacy');
  if (hasPrivacy) warnings.push('Privacy-restricted variables are blanked in sent messages.');

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

  if (body.length > 150 && computeVariableDensity(body) > 0.5) {
    errors.push('More than 50% of the message is variables.');
  }

  const valid = errors.length === 0;
  return { valid, compliant: valid && warnings.length === 0, errors, warnings, syntaxIssues };
}

// ── Sample variable substitution (live preview) ───────────────────────────────
// Mirrors the backend mapTemplateVariables behaviour:
//   - Known variables → substitute with sample data
//   - Privacy-restricted variables → blank (same as send-time behaviour)
//   - Unknown variables → blank (fail-safe)

export function mapSampleVariables(text: string): string {
  return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_full, key: string) => {
    if (PRIVACY_RESTRICTED_VARIABLES.has(key)) return '';
    if (!KNOWN_VARIABLES.has(key)) return '';
    return VARIABLE_SAMPLE_DATA[key] ?? '';
  });
}

// ── Cursor insertion ──────────────────────────────────────────────────────────

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

// ── Editor overlay highlight segments ────────────────────────────────────────

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
      className:
        issue.kind === 'privacy'
          ? 'bg-orange-200 dark:bg-orange-900/60'
          : issue.kind === 'unknown'
          ? 'bg-yellow-200 dark:bg-yellow-900/60'
          : 'bg-red-200 dark:bg-red-900/60',
    });
    cursor = issue.end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), className: '' });
  }

  return segments;
}
