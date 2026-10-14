/**
 * Slack Relay Service
 * Bridges Slack messages to AlsaniaMCP A2A
 */

import { sendSlackMessage, pollNewMessages, getBotUserId } from './slack-integration.js';

let lastChecked = '0';
let pollingInterval: NodeJS.Timeout | null = null;
let a2aHandler: ((from: string, message: string, threadTs: string) => Promise<string>) | null = null;

/**
 * Start polling Slack for new messages
 */
export function startSlackRelay(
  onMessage: (from: string, message: string, threadTs: string) => Promise<string>,
  intervalMs: number = 5000
): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  a2aHandler = onMessage;

  console.log(`🤖 Slack Relay started - polling every ${intervalMs}ms`);

  // Initial poll to set lastChecked
  pollNewMessages(lastChecked).then(messages => {
    if (messages.length > 0) {
      lastChecked = messages[messages.length - 1].ts;
    }
  }).catch(err => console.error('Initial poll error:', err));

  pollingInterval = setInterval(async () => {
    try {
      const messages = await pollNewMessages(lastChecked);
      
      for (const msg of messages) {
        console.log(`📨 Slack message from ${msg.user}: ${msg.text.substring(0, 100)}`);
        
        if (a2aHandler) {
          // Forward to A2A handler (which will send to Aegis)
          const response = await a2aHandler(msg.user, msg.text, msg.ts);
          
          // Send response back to Slack
          if (response) {
            await sendSlackMessage(response, msg.ts);
            console.log(`📤 Replied to ${msg.user}`);
          }
        }
        
        // Update last checked timestamp
        if (msg.ts > lastChecked) {
          lastChecked = msg.ts;
        }
      }
    } catch (error) {
      console.error('Slack poll error:', error);
    }
  }, intervalMs);
}

/**
 * Stop the Slack relay
 */
export function stopSlackRelay(): void {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('🛑 Slack Relay stopped');
  }
}

/**
 * Send a message to Slack (for outgoing messages from Aegis)
 */
export async function sendToSlack(message: string, threadTs?: string): Promise<void> {
  await sendSlackMessage(message, threadTs);
}
