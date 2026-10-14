/**
 * Slack Integration for AlsaniaMCP
 * Direct Slack API calls using bot token
 */

// Secrets must come from the environment. Never hardcode credentials.
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

interface SlackMessage {
  user: string;
  text: string;
  ts: string;
  channel: string;
}

/**
 * Send a message to the Slack channel
 */
export async function sendSlackMessage(text: string, threadTs?: string): Promise<any> {
  const url = 'https://slack.com/api/chat.postMessage';
  const body: any = {
    channel: SLACK_CHANNEL_ID,
    text: text,
  };
  if (threadTs) {
    body.thread_ts = threadTs;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!data.ok) {
    console.error('Slack send error:', data.error);
    throw new Error(`Slack error: ${data.error}`);
  }
  return data;
}

/**
 * Get recent messages from the Slack channel
 */
export async function getSlackMessages(limit: number = 10, oldest?: string): Promise<SlackMessage[]> {
  const url = `https://slack.com/api/conversations.history?channel=${SLACK_CHANNEL_ID}&limit=${limit}` + (oldest ? `&oldest=${oldest}` : '');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
    },
  });

  const data = await response.json();
  if (!data.ok) {
    console.error('Slack history error:', data.error);
    throw new Error(`Slack error: ${data.error}`);
  }

  return data.messages.map((msg: any) => ({
    user: msg.user,
    text: msg.text,
    ts: msg.ts,
    channel: SLACK_CHANNEL_ID,
  }));
}

/**
 * Get bot user ID
 */
export async function getBotUserId(): Promise<string> {
  const response = await fetch('https://slack.com/api/auth.test', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
    },
  });
  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Auth error: ${data.error}`);
  }
  return data.user_id;
}

/**
 * Poll for new messages since last check
 */
export async function pollNewMessages(lastTs: string = '0'): Promise<SlackMessage[]> {
  const messages = await getSlackMessages(20, lastTs);
  // Filter out messages from the bot itself and only get messages after lastTs
  const botId = await getBotUserId();
  return messages.filter(msg => msg.user !== botId && msg.ts > lastTs);
}

/**
 * Reply to a specific message (in thread)
 */
export async function replyToMessage(threadTs: string, text: string): Promise<any> {
  return sendSlackMessage(text, threadTs);
}
