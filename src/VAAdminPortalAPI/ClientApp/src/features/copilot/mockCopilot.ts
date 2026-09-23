// Mock Copilot engine. Answers are computed locally from the registrations that are
// already loaded in the dashboard, so no AI service is required for the demo.
import type { AiVirtualAssistantRegistration, AllOverview } from '../../api/types';
import { formatDate, registrationsByMonth } from '../../components/status';

export type CopilotIntent =
  | 'summary'
  | 'pending'
  | 'trend'
  | 'risk'
  | 'entities'
  | 'recent'
  | 'quality'
  | 'help'
  | 'unknown';

export type CopilotTone = 'positive' | 'warning' | 'critical' | 'neutral';

export interface CopilotHighlight {
  label: string;
  value: string;
  tone?: CopilotTone;
}

export interface CopilotAnswer {
  intent: CopilotIntent;
  headline: string;
  bullets: string[];
  highlights: CopilotHighlight[];
  followUps: string[];
  sourceNote: string;
}

export interface CopilotContext {
  items: AiVirtualAssistantRegistration[];
  overview: AllOverview | null;
  filterSummary?: string;
}

export const COPILOT_SUGGESTIONS = [
  'Summarize the registration data',
  'What needs my attention?',
  'How is the registration trend?',
  'Any failed or risky registrations?',
  'Which companies submitted the most assistants?',
  'Any data quality gaps?',
];

const INTENT_PATTERNS: { intent: CopilotIntent; pattern: RegExp }[] = [
  { intent: 'help', pattern: /\b(help|what can you|capabilit|who are you|hi|hello|hey)\b/ },
  { intent: 'quality', pattern: /(data quality|incomplete|missing|gap|privacy|logo|domain)/ },
  { intent: 'pending', pattern: /(pending|bottleneck|stuck|waiting|backlog|attention|action|queue|review first|oldest)/ },
  { intent: 'trend', pattern: /(trend|growth|over time|monthly|month|volume|momentum|forecast)/ },
  { intent: 'risk', pattern: /(risk|fail|reject|issue|problem|concern|blocked)/ },
  { intent: 'entities', pattern: /(compan|entit|business|country|region|top |individual|distribution|who submitted)/ },
  { intent: 'recent', pattern: /(recent|latest|newest|new submission|last few)/ },
  { intent: 'summary', pattern: /(summar|overview|snapshot|brief|tl;?dr|report|how are we|status)/ },
];

export function detectIntent(prompt: string): CopilotIntent {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) return 'help';
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(normalized)) return intent;
  }
  return 'unknown';
}

const percent = (value: number, total: number) =>
  total > 0 ? `${Math.round((value / total) * 100)}%` : '0%';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

const daysSince = (iso: string) => {
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return 0;
  return Math.max(0, Math.floor((Date.now() - date) / 86_400_000));
};

const isWaiting = (item: AiVirtualAssistantRegistration) =>
  !item.verified && item.validationStatus !== 'Failed';

const agreementAcceptance = (item: AiVirtualAssistantRegistration) =>
  item.agreementAcceptedDateTime
    ? `agreement accepted ${formatDate(item.agreementAcceptedDateTime)}${
        item.agreementAcceptedBy ? ` by ${item.agreementAcceptedBy}` : ''
      }`
    : 'no agreement acceptance recorded';

function topGroups(
  items: AiVirtualAssistantRegistration[],
  pick: (item: AiVirtualAssistantRegistration) => string | null | undefined,
  take = 3,
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = (pick(item) ?? '').trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([leftKey, leftCount], [rightKey, rightCount]) =>
      rightCount - leftCount || leftKey.localeCompare(rightKey),
    )
    .slice(0, take)
    .map(([name, count]) => ({ name, count }));
}

function emptyAnswer(intent: CopilotIntent): CopilotAnswer {
  return {
    intent,
    headline: 'There is no registration data in the current view.',
    bullets: [
      'Clear the date range or status filters and run the query again.',
      'I can only reason over the registrations that the dashboard has loaded.',
    ],
    highlights: [],
    followUps: ['Summarize the registration data', 'What can you do?'],
    sourceNote: 'No records available.',
  };
}

function buildSummary(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const { items } = context;
  const total = items.length;
  const verified = items.filter((item) => item.verified).length;
  const validationPending = items.filter((item) => item.validationStatus === 'Pending').length;
  const approvedUnverified = items.filter(
    (item) => item.validationStatus === 'Passed' && !item.verified,
  ).length;
  const failed = items.filter((item) => item.validationStatus === 'Failed').length;
  const monthly = registrationsByMonth(items);
  const busiest = monthly.reduce(
    (best, current) => (current.registrations > (best?.registrations ?? -1) ? current : best),
    monthly[0],
  );

  return {
    intent: 'summary',
    headline: `${plural(total, 'registration')} in scope, ${percent(verified, total)} verified.`,
    highlights: [
      { label: 'Total', value: String(total), tone: 'neutral' },
      { label: 'Verified', value: String(verified), tone: 'positive' },
      { label: 'Validation pending', value: String(validationPending), tone: 'warning' },
      { label: 'Validation failed', value: String(failed), tone: failed > 0 ? 'critical' : 'neutral' },
    ],
    bullets: [
      `${plural(verified, 'assistant')} are verified (${percent(verified, total)} of the total), based on the recorded verification flag.`,
      `${plural(validationPending, 'validation review')} are still pending.`,
      `${plural(approvedUnverified, 'registration')} passed validation but are not verified. Validation approval alone does not confirm verification; agreement acceptance may still be needed.`,
      failed > 0
        ? `${plural(failed, 'registration')} failed validation and may need follow-up with the submitter.`
        : 'No registration currently has failed validation.',
      busiest
        ? `Peak submission month in the loaded range is ${busiest.month} with ${plural(busiest.registrations, 'registration')}.`
        : 'Not enough history to determine a peak month.',
    ],
    followUps: ['What needs my attention?', 'How is the registration trend?', 'Any data quality gaps?'],
    sourceNote,
  };
}

function buildPending(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const waiting = context.items.filter(isWaiting);
  const oldest = [...waiting]
    .sort(
      (left, right) =>
        new Date(left.createdDateTime).getTime() - new Date(right.createdDateTime).getTime(),
    )
    .slice(0, 4);
  const validationBlocked = waiting.filter((i) => i.validationStatus !== 'Passed').length;
  const approvedUnverified = waiting.filter((i) => i.validationStatus === 'Passed').length;
  const stale = waiting.filter((i) => daysSince(i.createdDateTime) > 30).length;

  return {
    intent: 'pending',
    headline:
      waiting.length === 0
        ? 'No registrations are awaiting validation or verification follow-up; check failures separately.'
        : `${plural(waiting.length, 'registration')} need validation or verification follow-up.`,
    highlights: [
      { label: 'Awaiting action', value: String(waiting.length), tone: 'warning' },
      { label: 'Validation open', value: String(validationBlocked), tone: 'warning' },
      { label: 'Validation passed, unverified', value: String(approvedUnverified), tone: 'warning' },
      { label: 'Older than 30 days', value: String(stale), tone: stale > 0 ? 'critical' : 'neutral' },
    ],
    bullets: oldest.length
      ? [
          'Suggested follow-up order (oldest first; validation failures are listed separately):',
          ...oldest.map(
            (item) =>
              `${item.displayName} - ${item.legalEntity.businessName}, submitted ${formatDate(
                item.createdDateTime,
              )} (${plural(daysSince(item.createdDateTime), 'day')} old, validation ${
                item.validationStatus
              } / not verified, ${agreementAcceptance(item)}).`,
          ),
        ]
      : ['The follow-up queue is empty. Validation failures, if any, still need attention.'],
    followUps: ['Any failed or risky registrations?', 'Summarize the registration data'],
    sourceNote,
  };
}

function buildTrend(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const monthly = registrationsByMonth(context.items);
  if (monthly.length === 0) return emptyAnswer('trend');

  const last = monthly[monthly.length - 1];
  const previous = monthly[monthly.length - 2];
  const change = previous
    ? Math.round(((last.registrations - previous.registrations) / Math.max(1, previous.registrations)) * 100)
    : 0;
  const totalRegistrations = monthly.reduce((sum, month) => sum + month.registrations, 0);
  const totalVerified = monthly.reduce((sum, month) => sum + month.fullyVerified, 0);
  const average = Math.round(totalRegistrations / monthly.length);

  return {
    intent: 'trend',
    headline: previous
      ? `${last.month} closed at ${plural(last.registrations, 'registration')}, ${
          change >= 0 ? 'up' : 'down'
        } ${Math.abs(change)}% versus ${previous.month}.`
      : `${last.month} is the only month with data (${plural(last.registrations, 'registration')}).`,
    highlights: [
      { label: 'Latest month', value: String(last.registrations), tone: 'neutral' },
      {
        label: 'Change',
        value: `${change >= 0 ? '+' : ''}${change}%`,
        tone: change >= 0 ? 'positive' : 'critical',
      },
      { label: 'Monthly average', value: String(average), tone: 'neutral' },
      {
        label: 'Verified rate',
        value: percent(totalVerified, totalRegistrations),
        tone: 'positive',
      },
    ],
    bullets: [
      `Tracked window: ${monthly[0].month} to ${last.month} (${plural(monthly.length, 'month')}).`,
      `${plural(totalVerified, 'assistant')} submitted in that window are currently verified.`,
      change >= 0
        ? 'Submission volume is holding or growing - keep the review capacity steady.'
        : 'Submission volume dipped in the latest month; worth checking partner outreach.',
    ],
    followUps: ['What needs my attention?', 'Any failed or risky registrations?'],
    sourceNote,
  };
}

function buildRisk(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const failed = context.items.filter(
    (item) => item.validationStatus === 'Failed',
  );
  const affectedCompanies = topGroups(failed, (item) => item.legalEntity.businessName, 3);

  return {
    intent: 'risk',
    headline:
      failed.length === 0
        ? 'No validation failures detected in the current view.'
        : `${plural(failed.length, 'registration')} failed validation.`,
    highlights: [
      { label: 'Validation failed', value: String(failed.length), tone: failed.length ? 'critical' : 'positive' },
      {
        label: 'Validation failure rate',
        value: percent(failed.length, context.items.length),
        tone: failed.length ? 'warning' : 'positive',
      },
    ],
    bullets: failed.length
      ? [
          ...failed
            .slice(0, 4)
            .map(
              (item) =>
                `${item.displayName} (${item.legalEntity.businessName}) - validation ${item.validationStatus}, ${item.verified ? 'verified' : 'not verified'}.`,
            ),
          affectedCompanies.length
            ? `Most affected submitter: ${affectedCompanies[0].name} with ${plural(
                affectedCompanies[0].count,
                'failed registration',
              )}.`
            : 'Failures are spread across different submitters.',
        ]
      : ['No validation failures are recorded. Validation approval does not necessarily mean a registration is verified; check the attention queue for outstanding work.'],
    followUps: ['What needs my attention?', 'Any data quality gaps?'],
    sourceNote,
  };
}

function buildEntities(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const { items } = context;
  const companies = topGroups(items, (item) => item.legalEntity.businessName, 4);
  const countries = topGroups(items, (item) => item.legalEntity.country, 3);
  const individuals = items.filter((item) => item.legalEntity.entityType === 'Individual').length;

  return {
    intent: 'entities',
    headline: companies.length
      ? `${companies[0].name} leads with ${plural(companies[0].count, 'registration')}.`
      : 'No submitter information available.',
    highlights: [
      { label: 'Distinct submitters', value: String(new Set(items.map((i) => i.legalEntity.businessName)).size), tone: 'neutral' },
      { label: 'Companies', value: String(items.length - individuals), tone: 'neutral' },
      { label: 'Individuals', value: String(individuals), tone: 'neutral' },
    ],
    bullets: [
      'Top submitters:',
      ...companies.map((company) => `${company.name} - ${plural(company.count, 'registration')}.`),
      countries.length
        ? `Top regions: ${countries.map((country) => `${country.name} (${country.count})`).join(', ')}.`
        : 'Country information is not populated for these records.',
    ],
    followUps: ['Any failed or risky registrations?', 'How is the registration trend?'],
    sourceNote,
  };
}

function buildRecent(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const recent = [...context.items]
    .sort(
      (left, right) =>
        new Date(right.createdDateTime).getTime() - new Date(left.createdDateTime).getTime(),
    )
    .slice(0, 5);
  const lastThirtyDays = context.items.filter((item) => daysSince(item.createdDateTime) <= 30).length;

  return {
    intent: 'recent',
    headline: recent.length
      ? `Latest submission arrived ${formatDate(recent[0].createdDateTime)}.`
      : 'No submissions found.',
    highlights: [
      { label: 'Last 30 days', value: String(lastThirtyDays), tone: 'neutral' },
      { label: 'Shown', value: String(recent.length), tone: 'neutral' },
    ],
    bullets: recent.map(
      (item) =>
        `${formatDate(item.createdDateTime)} - ${item.displayName} (${item.legalEntity.businessName}), validation ${item.validationStatus} / ${item.verified ? 'verified' : 'not verified'}, ${agreementAcceptance(item)}.`,
    ),
    followUps: ['What needs my attention?', 'Summarize the registration data'],
    sourceNote,
  };
}

function buildQuality(context: CopilotContext, sourceNote: string): CopilotAnswer {
  const { items } = context;
  const missingDomain = items.filter((item) => !item.domain).length;
  const missingPrivacy = items.filter((item) => !item.privacyStatementUrl).length;
  const missingLogo = items.filter((item) => !item.logoUrl).length;
  const missingLegalId = items.filter((item) => !item.legalEntity.legalIdentifier).length;
  const totalGaps = missingDomain + missingPrivacy + missingLogo + missingLegalId;

  return {
    intent: 'quality',
    headline:
      totalGaps === 0
        ? 'All loaded registrations have complete profile data.'
        : `${plural(totalGaps, 'field gap')} found across the loaded registrations.`,
    highlights: [
      { label: 'No domain', value: String(missingDomain), tone: missingDomain ? 'warning' : 'positive' },
      { label: 'No privacy URL', value: String(missingPrivacy), tone: missingPrivacy ? 'critical' : 'positive' },
      { label: 'No logo', value: String(missingLogo), tone: missingLogo ? 'warning' : 'positive' },
      { label: 'No legal ID', value: String(missingLegalId), tone: missingLegalId ? 'critical' : 'positive' },
    ],
    bullets: [
      `${plural(missingPrivacy, 'registration')} are missing a privacy statement URL - follow up with the submitter as part of validation.`,
      `${plural(missingLegalId, 'registration')} have no legal identifier recorded.`,
      `${plural(missingDomain, 'registration')} have no domain and ${plural(missingLogo, 'registration')} have no logo, which weakens the trust profile.`,
    ],
    followUps: ['What needs my attention?', 'Any failed or risky registrations?'],
    sourceNote,
  };
}

function buildHelp(sourceNote: string): CopilotAnswer {
  return {
    intent: 'help',
    headline: 'I am the VA Admin Copilot (demo mode). I read the dashboard data you have loaded.',
    highlights: [],
    bullets: [
      'Ask me for a summary of registrations, validation outcomes, verification status, or monthly trends.',
      'Ask what needs attention and I will rank the oldest items awaiting validation or verification follow-up.',
      'Ask about failures, submitters, regions, or data quality gaps.',
      'My answers respect the filters currently applied to the dashboard.',
    ],
    followUps: COPILOT_SUGGESTIONS.slice(0, 3),
    sourceNote,
  };
}

function buildUnknown(prompt: string, context: CopilotContext, sourceNote: string): CopilotAnswer {
  const base = buildSummary(context, sourceNote);
  return {
    ...base,
    intent: 'unknown',
    headline: `I could not map "${prompt.trim()}" to a known skill, so here is the current snapshot.`,
    followUps: COPILOT_SUGGESTIONS.slice(0, 4),
  };
}

export function answerPrompt(prompt: string, context: CopilotContext): CopilotAnswer {
  const intent = detectIntent(prompt);
  const sourceNote = `Based on ${plural(context.items.length, 'loaded registration')}${
    context.filterSummary ? ` (${context.filterSummary})` : ''
  }.`;

  if (intent === 'help') return buildHelp(sourceNote);
  if (context.items.length === 0) return emptyAnswer(intent);

  switch (intent) {
    case 'summary':
      return buildSummary(context, sourceNote);
    case 'pending':
      return buildPending(context, sourceNote);
    case 'trend':
      return buildTrend(context, sourceNote);
    case 'risk':
      return buildRisk(context, sourceNote);
    case 'entities':
      return buildEntities(context, sourceNote);
    case 'recent':
      return buildRecent(context, sourceNote);
    case 'quality':
      return buildQuality(context, sourceNote);
    default:
      return buildUnknown(prompt, context, sourceNote);
  }
}

// Simulates network + model latency so the demo feels like a real assistant.
export function askMockCopilot(
  prompt: string,
  context: CopilotContext,
  signal?: AbortSignal,
): Promise<CopilotAnswer> {
  const delay = 500 + Math.random() * 700;
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(answerPrompt(prompt, context)), delay);
    signal?.addEventListener('abort', () => {
      window.clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
}
