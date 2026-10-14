import { Tracer } from '../../../src/observability/tracer';

describe('Tracer — span tracing (jarvis OTel concept port)', () => {
  let tracer: Tracer;

  beforeEach(() => {
    tracer = new Tracer();
  });

  it('starts a span with ids and ok status', () => {
    const s = tracer.startSpan('op', { a: 1 });
    expect(s.traceId).toHaveLength(32);
    expect(s.spanId).toHaveLength(16);
    expect(s.status).toBe('ok');
    expect(s.attributes.a).toBe(1);
  });

  it('ends a span and records duration', async () => {
    const s = tracer.startSpan('op');
    await new Promise((r) => setTimeout(r, 5));
    tracer.endSpan(s, 'ok');
    expect(s.endTime).toBeGreaterThanOrEqual(s.startTime);
    expect(s.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('records errors with message', () => {
    const s = tracer.startSpan('op');
    tracer.endSpan(s, 'error', 'boom');
    expect(s.status).toBe('error');
    expect(s.error).toBe('boom');
  });

  it('nests child spans under the parent traceId', () => {
    const parent = tracer.startSpan('parent');
    const child = tracer.startSpan('child', {}, parent.spanId);
    expect(child.traceId).toBe(parent.traceId);
    expect(child.parentSpanId).toBe(parent.spanId);
    expect(child.spanId).not.toBe(parent.spanId);
  });

  it('withSpan returns the result and records ok', async () => {
    const out = await tracer.withSpan('op', {}, async () => 42);
    expect(out).toBe(42);
    expect(tracer.getFinished()[0].status).toBe('ok');
  });

  it('withSpan records error and rethrows', async () => {
    await expect(
      tracer.withSpan('op', {}, async () => {
        throw new Error('nope');
      }),
    ).rejects.toThrow('nope');
    expect(tracer.getFinished()[0].status).toBe('error');
    expect(tracer.getFinished()[0].error).toBe('nope');
  });

  it('reconstructs a trace by traceId', () => {
    const parent = tracer.startSpan('parent');
    const child = tracer.startSpan('child', {}, parent.spanId);
    tracer.endSpan(parent);
    tracer.endSpan(child);
    expect(tracer.getTrace(parent.traceId)).toHaveLength(2);
  });

  it('exports spans as JSONL', () => {
    const s = tracer.startSpan('op');
    tracer.endSpan(s);
    const lines = tracer.exportJsonl().split('\n');
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).name).toBe('op');
  });

  it('calls the sink on span end', () => {
    const seen: string[] = [];
    const t = new Tracer(1000, (sp) => seen.push(sp.name));
    const s = t.startSpan('sunk');
    t.endSpan(s);
    expect(seen).toEqual(['sunk']);
  });

  it('caps the finished ring buffer', () => {
    const t = new Tracer(2);
    for (let i = 0; i < 5; i++) {
      const s = t.startSpan('op' + i);
      t.endSpan(s);
    }
    expect(t.getFinished()).toHaveLength(2);
  });
});
