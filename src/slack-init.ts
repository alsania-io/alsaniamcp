/**
 * Slack Relay Initialization
 * Uses Socket Mode for real-time messages (no polling)
 * Also listens for A2A messages to forward to Slack
 */

import { startSlackSocket, sendToSlackChannel } from './slack-socket.js';

export async function initSlackRelay(a2a: any, MessageType: any): Promise<void> {
  if (process.env.SLACK_RELAY_ENABLED !== 'true') {
    console.log('Slack Relay disabled (set SLACK_RELAY_ENABLED=true to enable)');
    return;
  }

  if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_APP_TOKEN) {
    console.log('Slack Relay disabled: missing SLACK_BOT_TOKEN or SLACK_APP_TOKEN');
    return;
  }

  // Handle incoming Slack messages -> forward to Aegis
  const handleSlackMessage = async (from: string, message: string, channel: string, threadTs?: string): Promise<string> => {
    console.log(`🔄 Forwarding Slack message from ${from} to Aegis`);
    
    try {
      const result = await a2a.sendMessage(
        'aegis',
        MessageType.EVENT,
        { 
          content: `[Slack from ${from}]: ${message}`, 
          from: 'slack-relay',
          channel,
          threadTs
        }
      );
      console.log(`✅ Message forwarded to Aegis, ID: ${result}`);
      return `Message received by Aegis. (ID: ${result.substring(0, 8)}...)`;
    } catch (error: any) {
      console.error(`Failed to forward message: ${error.message}`);
      return `Error: Could not reach Aegis. ${error.message}`;
    }
  };

  // Handle incoming A2A messages addressed to slack-relay -> forward to Slack
  const handleA2AMessage = (message: any) => {
    // Check if message is for slack-relay
    if (message.to === 'slack-relay' && message.payload?.content) {
      console.log(`🔄 Forwarding A2A message from ${message.from} to Slack`);
      const slackMessage = message.payload.content;
      // Send to default channel
      sendToSlackChannel(slackMessage).catch(err => console.error('Failed to send to Slack:', err));
    }
  };

  // Register A2A message listener
  a2a.on('message', handleA2AMessage);

  await startSlackSocket(handleSlackMessage);
  console.log('✅ Slack Relay started with Socket Mode - real-time messaging active');
  console.log('   - Slack → Aegis: forwarding messages')
  console.log('   - Aegis → Slack: listening for messages to "slack-relay"');
}
