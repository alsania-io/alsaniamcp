// Lightweight span tracer — jarvis OTel concept port.
//
// jarvis exports spans to an OTel collector (Go/Python + Grafana/Tempo stack).
// AlsaniaMCP stays zero-dep + low-resource: we port the CONCEPT — spans with
// trace/span/parent IDs, timing, and status — plus an optional JSON sink.
// No @opentelemetry/* dependency. Fits in a single file.

import { randomBytes } from "node:crypto";

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  status: "ok" | "error";
  attributes: Record<string, unknown>;
  error?: string;
}

function id(bytes: number): string {
  return randomBytes(bytes).toString("hex");
}

/** Optional sink: receives every completed span (e.g. write to file/stdout). */
export type SpanSink = (span: Span) => void;

export class Tracer {
  private activeSpans: Map<string, Span> = new Map();
  private finished: Span[] = [];

  constructor(
    private maxFinished = 1000,
    private sink?: SpanSink,
  ) {}

  /** Start a span. Pass a parentSpanId to nest it under an existing span. */
  startSpan(
    name: string,
    attributes: Record<string, unknown> = {},
    parentSpanId?: string,
  ): Span {
    const parent = parentSpanId ? this.activeSpans.get(parentSpanId) : undefined;
    const span: Span = {
      traceId: parent?.traceId ?? id(16),
      spanId: id(8),
      parentSpanId,
      name,
      startTime: Date.now(),
      status: "ok",
      attributes,
    };
    this.activeSpans.set(span.spanId, span);
    return span;
  }

  /** End a span, record duration + status, push to the ring buffer + sink. */
  endSpan(
    span: Span,
    status: "ok" | "error" = "ok",
    error?: string,
    extra: Record<string, unknown> = {},
  ): Span {
    span.endTime = Date.now();
    span.durationMs = span.endTime - span.startTime;
    span.status = status;
    if (error) span.error = error;
    Object.assign(span.attributes, extra);
    this.activeSpans.delete(span.spanId);

    this.finished.push(span);
    if (this.finished.length > this.maxFinished) {
      this.finished.shift();
    }
    if (this.sink) this.sink(span);
    return span;
  }

  /** Convenience: run an async fn inside a span, auto-recording success/failure. */
  async withSpan<T>(
    name: string,
    attributes: Record<string, unknown>,
    fn: (span: Span) => Promise<T>,
    parentSpanId?: string,
  ): Promise<T> {
    const span = this.startSpan(name, attributes, parentSpanId);
    try {
      const result = await fn(span);
      this.endSpan(span, "ok");
      return result;
    } catch (e) {
      this.endSpan(span, "error", e instanceof Error ? e.message : String(e));
      throw e;
    }
  }

  /** Snapshot of completed spans (ring buffer). */
  getFinished(): Span[] {
    return [...this.finished];
  }

  /** All spans sharing a traceId — reconstruct a full call tree. */
  getTrace(traceId: string): Span[] {
    return this.finished.filter((s) => s.traceId === traceId);
  }

  /** Export completed spans as JSON Lines (one span per line). */
  exportJsonl(): string {
    return this.finished.map((s) => JSON.stringify(s)).join("\n");
  }
}
