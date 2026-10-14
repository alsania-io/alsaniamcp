/**
 * Scribe Audit Logger - Integration with @alsania-io/scribe
 * Provides audit logging capabilities alongside the existing console logger
 */

import { Scribe } from '@alsania-io/scribe';
import { Logger } from '../types.js';

export interface AuditLoggerConfig {
  /** Enable audit logging */
  enabled: boolean;
  /** Log directory root */
  logRoot?: string;
  /** Redact patterns */
  redact?: string[];
  /** Owner name for logs */
  owner?: string;
  /** Model name */
  model?: string;
  /** MCP URL */
  mcpUrl?: string;
}

/**
 * Audit logger that wraps Scribe for AlsaniaMCP
 */
export class AuditLogger {
  private scribe: Scribe | null = null;
  private enabled: boolean;
  private sessionId: string;
  private logger: Logger;

  constructor(config: AuditLoggerConfig, logger: Logger) {
    this.enabled = config.enabled;
    this.logger = logger;
    this.sessionId = `alsaniamcp-${Date.now()}`;

    if (this.enabled) {
      try {
        this.scribe = new Scribe({
          root: config.logRoot || './logs/alsaniamcp',
          redact: config.redact || [
            'Authorization',
            'api_key',
            'bearer',
            'password',
            'secret',
            'token',
            'X-Alsania-Sig',
            'SESSION_SECRET',
          ],
        });

        this.scribe.session(this.sessionId, {
          owner: config.owner || 'Unknown',
          model: config.model || 'echo-cloud',
          mcpUrl: config.mcpUrl || 'http://localhost:8050/mcp',
        });

        this.logger.info(`Audit logging enabled: ${this.sessionId}`);
      } catch (error) {
        this.logger.error('Failed to initialize audit logger:', error);
        this.scribe = null;
        this.enabled = false;
      }
    }
  }

  /**
   * Log a prompt
   */
  prompt(content: string, metadata?: Record<string, any>): void {
    if (!this.enabled || !this.scribe) return;
    try {
      this.scribe.prompt(content, metadata);
    } catch (error) {
      this.logger.debug('Failed to write prompt to audit log:', error);
    }
  }

  /**
   * Log a response
   */
  response(content: string, metadata?: Record<string, any>): void {
    if (!this.enabled || !this.scribe) return;
    try {
      this.scribe.response(content, metadata);
    } catch (error) {
      this.logger.debug('Failed to write response to audit log:', error);
    }
  }

  /**
   * Log a tool call
   */
  toolCall(toolName: string, args: any, result?: any): void {
    if (!this.enabled || !this.scribe) return;
    try {
      this.scribe.toolCall(toolName, args, result);
    } catch (error) {
      this.logger.debug('Failed to write tool call to audit log:', error);
    }
  }

  /**
   * Log an error
   */
  error(message: string, stack?: string, metadata?: Record<string, any>): void {
    if (!this.enabled || !this.scribe) return;
    try {
      this.scribe.error(message, stack, metadata);
    } catch (error) {
      this.logger.debug('Failed to write error to audit log:', error);
    }
  }

  /**
   * Log an event
   */
  event(name: string, data?: any): void {
    if (!this.enabled || !this.scribe) return;
    try {
      this.scribe.event(name, data);
    } catch (error) {
      this.logger.debug('Failed to write event to audit log:', error);
    }
  }

  /**
   * Write a raw entry
   */
  write(entry: { type: string; content: string; metadata?: Record<string, any> }): void {
    if (!this.enabled || !this.scribe) return;
    try {
      this.scribe.write({
        timestamp: new Date(),
        type: entry.type,
        content: entry.content,
        metadata: entry.metadata,
      });
    } catch (error) {
      this.logger.debug('Failed to write audit entry:', error);
    }
  }

  /**
   * Get the latest log file path
   */
  getLatestLog(): string | null {
    if (!this.enabled || !this.scribe) return null;
    try {
      return this.scribe.getLatestLog();
    } catch (error) {
      this.logger.debug('Failed to get latest log:', error);
      return null;
    }
  }

  /**
   * Anchor the latest log
   */
  anchorLatest(): { file: string; hash: string } | null {
    if (!this.enabled || !this.scribe) return null;
    try {
      return this.scribe.anchorLatest();
    } catch (error) {
      this.logger.debug('Failed to anchor log:', error);
      return null;
    }
  }

  /**
   * Get all anchors
   */
  getAnchors(): { timestamp: number; file: string; hash: string }[] {
    if (!this.enabled || !this.scribe) return [];
    try {
      return this.scribe.getAnchors();
    } catch (error) {
      this.logger.debug('Failed to get anchors:', error);
      return [];
    }
  }

  /**
   * Check if audit logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled && this.scribe !== null;
  }

  /**
   * Get the session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

/**
 * Create an audit logger instance
 */
export function createAuditLogger(
  config: AuditLoggerConfig,
  logger: Logger
): AuditLogger {
  return new AuditLogger(config, logger);
}

/**
 * Default audit logger configuration
 */
export const defaultAuditConfig: AuditLoggerConfig = {
  enabled: process.env.AUDIT_LOGGING_ENABLED === 'true',
  logRoot: process.env.AUDIT_LOG_ROOT || './logs/alsaniamcp',
  redact: ['Authorization', 'api_key', 'bearer', 'password', 'secret', 'token', 'X-Alsania-Sig', 'SESSION_SECRET'],
  owner: process.env.AUDIT_OWNER || 'Unknown',
  model: process.env.AUDIT_MODEL || 'echo-cloud',
  mcpUrl: process.env.AUDIT_MCP_URL || 'http://localhost:8050/mcp',
};
