/**
 * Slack Socket Mode Integration
 * Real-time message delivery via WebSocket (no polling)
 */

import { App, SayFn } from '@slack/bolt';

// Secrets must come from the environment. Never hardcode credentials.
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

let app: App | null = null;
let messageHandler: ((from: string, message: string, channel: string, threadTs?: string) => Promise<string>) | null = null;

/**
 * Start Slack Socket Mode listener
 */
export async function startSlackSocket(
  onMessage: (from: string, message: string, channel: string, threadTs?: string) => Promise<string>
): Promise<void> {
  messageHandler = onMessage;

  app = new App({
    token: SLACK_BOT_TOKEN,
    appToken: SLACK_APP_TOKEN,
    socketMode: true,
  });

  // Listen for messages in channels
  app.message(async ({ message, say, client }) => {
    const msg = message as any;
    
    // Ignore bot messages
    if (msg.bot_id || msg.subtype === 'bot_message') return;
    
    const userId = msg.user;
    const text = msg.text || '';
    const channel = msg.channel;
    const threadTs = msg.thread_ts;
    
    console.log(`📨 Slack message from ${userId} in ${channel}: ${text.substring(0, 100)}`);
    
    if (messageHandler) {
      try {
        const response = await messageHandler(userId, text, channel, threadTs);
        if (response) {
          await say(response);
          console.log(`📤 Replied to ${userId}`);
        }
      } catch (error) {
        console.error('Error handling message:', error);
        await say('Sorry, I encountered an error processing your message.');
      }
    }
  });

  // Listen for mentions
  app.event('app_mention', async ({ event, say }) => {
    const userId = event.user;
    const text = event.text;
    console.log(`📨 Mention from ${userId}: ${text}`);
    
    if (messageHandler) {
      const response = await messageHandler(userId, text, event.channel, event.thread_ts);
      if (response) await say(response);
    }
  });

  await app.start();
  console.log('✅ Slack Socket Mode started - listening for real-time messages');
}

/**
 * Send a message to Slack channel
 */
export async function sendToSlackChannel(text: string, channel?: string, threadTs?: string): Promise<void> {
  if (!app) {
    console.error('Slack app not started');
    return;
  }
  
  try {
    await app.client.chat.postMessage({
      token: SLACK_BOT_TOKEN,
      channel: channel || SLACK_CHANNEL_ID,
      text,
      thread_ts: threadTs,
    });
  } catch (error) {
    console.error('Failed to send Slack message:', error);
  }
}

/**
 * Stop Slack Socket Mode
 */
export async function stopSlackSocket(): Promise<void> {
  if (app) {
    await app.stop();
    console.log('🛑 Slack Socket Mode stopped');
  }
}
