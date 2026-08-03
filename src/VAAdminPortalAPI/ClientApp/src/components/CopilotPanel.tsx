import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Divider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Spinner,
  Textarea,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components';
import {
  CopyRegular,
  DeleteRegular,
  DismissRegular,
  SendRegular,
} from '@fluentui/react-icons';
import CopilotIcon from './CopilotIcon';
import type { AiVirtualAssistantRegistration, AllOverview } from '../api/types';
import {
  COPILOT_SUGGESTIONS,
  askMockCopilot,
  type CopilotAnswer,
  type CopilotHighlight,
} from '../features/copilot/mockCopilot';

const useStyles = makeStyles({
  drawer: {
    borderLeft: '1px solid #e0e0e0',
    boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.12)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    paddingBottom: '12px',
  },
  thread: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    paddingRight: '4px',
  },
  userRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  userBubble: {
    maxWidth: '85%',
    padding: '8px 12px',
    borderRadius: '12px 12px 2px 12px',
    backgroundColor: '#5b5fc7',
    color: '#ffffff',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  answerCard: {
    border: '1px solid #e0e0e0',
    borderLeft: '3px solid #5b5fc7',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  headline: {
    fontWeight: 600,
  },
  caret: {
    display: 'inline-block',
    width: '7px',
    marginLeft: '2px',
    backgroundColor: '#5b5fc7',
    animationName: {
      '0%, 45%': { opacity: 1 },
      '50%, 100%': { opacity: 0 },
    },
    animationDuration: '1s',
    animationIterationCount: 'infinite',
  },
  highlights: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: '8px',
  },
  highlight: {
    borderRadius: '6px',
    padding: '8px 10px',
    backgroundColor: '#f7f7ff',
    border: '1px solid #ececf5',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  highlightValue: {
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: '24px',
  },
  bulletList: {
    margin: 0,
    paddingLeft: '18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  bullet: {
    lineHeight: '20px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
    color: tokens.colorNeutralForeground3,
  },
  chips: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    borderRadius: '14px',
  },
  thinking: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: tokens.colorNeutralForeground3,
  },
  composer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '12px',
  },
  composerRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
  },
  input: {
    flex: 1,
  },
  disclaimer: {
    color: tokens.colorNeutralForeground3,
  },
});

interface UserMessage {
  kind: 'user';
  id: string;
  text: string;
}

interface AssistantMessage {
  kind: 'assistant';
  id: string;
  answer: CopilotAnswer;
  animate: boolean;
}

type CopilotMessage = UserMessage | AssistantMessage;

const TONE_COLORS: Record<string, string> = {
  positive: '#107c10',
  warning: '#b45309',
  critical: '#d13438',
  neutral: '#5b5fc7',
};

const answerToText = (answer: CopilotAnswer) =>
  [
    answer.headline,
    ...answer.highlights.map((item) => `${item.label}: ${item.value}`),
    ...answer.bullets.map((bullet) => `- ${bullet}`),
    answer.sourceNote,
  ].join('\n');

function HighlightTile({ highlight }: { highlight: CopilotHighlight }) {
  const styles = useStyles();
  return (
    <div className={styles.highlight}>
      <span
        className={styles.highlightValue}
        style={{ color: TONE_COLORS[highlight.tone ?? 'neutral'] }}
      >
        {highlight.value}
      </span>
      <Caption1>{highlight.label}</Caption1>
    </div>
  );
}

function AnswerCard({
  answer,
  animate,
  onFollowUp,
}: {
  answer: CopilotAnswer;
  animate: boolean;
  onFollowUp: (prompt: string) => void;
}) {
  const styles = useStyles();
  const [typedLength, setTypedLength] = useState(animate ? 0 : answer.headline.length);
  const [visibleBullets, setVisibleBullets] = useState(animate ? 0 : answer.bullets.length);

  useEffect(() => {
    if (!animate) return undefined;
    const timer = window.setInterval(() => {
      setTypedLength((current) => {
        if (current >= answer.headline.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 2;
      });
    }, 16);
    return () => window.clearInterval(timer);
  }, [animate, answer.headline]);

  const headlineDone = typedLength >= answer.headline.length;

  useEffect(() => {
    if (!animate || !headlineDone) return undefined;
    const timer = window.setInterval(() => {
      setVisibleBullets((current) => {
        if (current >= answer.bullets.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 110);
    return () => window.clearInterval(timer);
  }, [animate, headlineDone, answer.bullets.length]);

  const complete = headlineDone && visibleBullets >= answer.bullets.length;

  return (
    <div className={styles.answerCard}>
      <Body1 className={styles.headline}>
        {answer.headline.slice(0, typedLength)}
        {!headlineDone && <span className={styles.caret}>&nbsp;</span>}
      </Body1>

      {headlineDone && answer.highlights.length > 0 && (
        <div className={styles.highlights}>
          {answer.highlights.map((highlight) => (
            <HighlightTile key={highlight.label} highlight={highlight} />
          ))}
        </div>
      )}

      {visibleBullets > 0 && (
        <ul className={styles.bulletList}>
          {answer.bullets.slice(0, visibleBullets).map((bullet, index) => (
            <li key={index} className={styles.bullet}>
              <Caption1>{bullet}</Caption1>
            </li>
          ))}
        </ul>
      )}

      {complete && (
        <>
          <Divider />
          <div className={styles.meta}>
            <Caption1>{answer.sourceNote}</Caption1>
            <Button
              size="small"
              appearance="subtle"
              icon={<CopyRegular />}
              aria-label="Copy answer"
              onClick={() => navigator.clipboard?.writeText(answerToText(answer))}
            />
          </div>
          {answer.followUps.length > 0 && (
            <div className={styles.chips}>
              {answer.followUps.map((followUp) => (
                <Button
                  key={followUp}
                  className={styles.chip}
                  size="small"
                  appearance="outline"
                  onClick={() => onFollowUp(followUp)}
                >
                  {followUp}
                </Button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function CopilotPanel({
  open,
  onClose,
  items,
  overview,
  filterSummary,
}: {
  open: boolean;
  onClose: () => void;
  items: AiVirtualAssistantRegistration[];
  overview: AllOverview | null;
  filterSummary?: string;
}) {
  const styles = useStyles();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const messageId = useRef(0);
  const greeted = useRef(false);

  const context = useMemo(
    () => ({ items, overview, filterSummary }),
    [items, overview, filterSummary],
  );
  const contextRef = useRef(context);
  contextRef.current = context;

  const nextId = () => {
    messageId.current += 1;
    return String(messageId.current);
  };

  const send = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || thinking) return;

    setMessages((current) => [...current, { kind: 'user', id: nextId(), text: trimmed }]);
    setInput('');
    setThinking(true);

    askMockCopilot(trimmed, contextRef.current)
      .then((answer) => {
        setMessages((current) => [
          ...current,
          { kind: 'assistant', id: nextId(), answer, animate: true },
        ]);
      })
      .finally(() => setThinking(false));
  };

  useEffect(() => {
    if (!open || greeted.current) return;
    greeted.current = true;
    setThinking(true);
    askMockCopilot('Summarize the registration data', contextRef.current)
      .then((answer) => {
        setMessages([{ kind: 'assistant', id: nextId(), answer, animate: true }]);
      })
      .finally(() => setThinking(false));
  }, [open]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const clearThread = () => {
    setMessages([]);
    greeted.current = false;
  };

  return (
    <Drawer
      className={styles.drawer}
      type="overlay"
      position="end"
      separator
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
      size="medium"
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <div style={{ display: 'flex', gap: '4px' }}>
              <Button
                appearance="subtle"
                icon={<DeleteRegular />}
                aria-label="Clear conversation"
                onClick={clearThread}
              />
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                aria-label="Close Copilot"
                onClick={onClose}
              />
            </div>
          }
        >
          <span className={styles.headerTitle}>
            <CopilotIcon fontSize={22} />
            Copilot
            <Badge appearance="tint" color="informative">
              Demo
            </Badge>
          </span>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        <div className={styles.thread} ref={threadRef}>
          {messages.length === 0 && !thinking && (
            <div className={styles.answerCard}>
              <Body1 className={styles.headline}>Ask about the registration data.</Body1>
              <Caption1>
                I analyze the registrations currently loaded in the dashboard and answer with the
                numbers behind them.
              </Caption1>
            </div>
          )}

          {messages.map((message) =>
            message.kind === 'user' ? (
              <div key={message.id} className={styles.userRow}>
                <div className={mergeClasses(styles.userBubble)}>{message.text}</div>
              </div>
            ) : (
              <AnswerCard
                key={message.id}
                answer={message.answer}
                animate={message.animate}
                onFollowUp={send}
              />
            ),
          )}

          {thinking && (
            <div className={styles.thinking}>
              <Spinner size="tiny" />
              <Caption1>Copilot is analyzing the data...</Caption1>
            </div>
          )}
        </div>

        <div className={styles.composer}>
          <div className={styles.chips}>
            {COPILOT_SUGGESTIONS.slice(0, 3).map((suggestion) => (
              <Button
                key={suggestion}
                className={styles.chip}
                size="small"
                appearance="outline"
                disabled={thinking}
                onClick={() => send(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
          <div className={styles.composerRow}>
            <Textarea
              className={styles.input}
              resize="none"
              rows={2}
              value={input}
              placeholder="Ask Copilot about registrations, trends, or pending reviews"
              onChange={(_, data) => setInput(data.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send(input);
                }
              }}
            />
            <Button
              appearance="primary"
              icon={<SendRegular />}
              aria-label="Send message"
              disabled={thinking || input.trim().length === 0}
              onClick={() => send(input)}
            />
          </div>
          <Caption1 className={styles.disclaimer}>
            Mock Copilot for demo purposes. Responses are generated locally from dashboard data.
          </Caption1>
        </div>
      </DrawerBody>
    </Drawer>
  );
}
