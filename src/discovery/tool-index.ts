// Semantic Tool Discovery — jarvis-registry concept port.
//
// jarvis uses FAISS + sentence-transformers (Python). AlsaniaMCP is TS-only,
// free-tools-only, low-resource — so we port the CONCEPT, not the stack:
// a zero-dependency lexical + fuzzy index over registered tool metadata.
// Delivers the core value: natural-language query -> ranked relevant tools.
//
// No external deps. No model download. Runs on a low-end laptop.

export interface IndexedTool {
  serverId: string;
  name: string;
  description: string;
  haystack: string;
}

export interface DiscoveryHit {
  serverId: string;
  name: string;
  description: string;
  score: number;
}

// Query-side vocabulary expansion (jarvis's "rich descriptions" best-practice,
// applied to the query instead of requiring hand-tuned index text).
const SYNONYMS: Record<string, string[]> = {
  time: ["clock", "date", "timezone", "now"],
  date: ["calendar", "time", "day", "schedule"],
  weather: ["forecast", "temperature", "climate"],
  search: ["find", "query", "lookup", "grep"],
  file: ["fs", "filesystem", "read", "write", "path"],
  git: ["repo", "commit", "branch", "version"],
  memory: ["recall", "remember", "store", "knowledge"],
  fetch: ["http", "request", "url", "download"],
  math: ["calc", "compute", "arithmetic", "sum"],
  message: ["send", "chat", "notify", "broadcast"],
};

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

// Levenshtein distance for fuzzy token matching (typos, partial words).
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(
        dp[j] + 1,
        dp[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return dp[n];
}

// Score one tool against query tokens. Weighted: exact token hit in the tool
// NAME scores highest, then description, then fuzzy (edit-distance) matches.
function scoreTool(
  tool: IndexedTool,
  nameTokens: Set<string>,
  queryTokens: string[],
): number {
  const hayTokens = tokenize(tool.haystack);
  const haySet = new Set(hayTokens);
  let score = 0;

  for (const q of queryTokens) {
    // exact match anywhere
    if (haySet.has(q)) score += nameTokens.has(q) ? 3 : 1;
    // fuzzy match against haystack tokens (edit distance <= 1 for len>3)
    else if (q.length > 3) {
      for (const h of hayTokens) {
        if (Math.abs(h.length - q.length) <= 2 && levenshtein(q, h) <= 1) {
          score += 0.5;
          break;
        }
      }
    }
  }
  return score;
}

/**
 * In-memory tool discovery index. Populate via `add()` as tools register
 * (hook in MCPProxyManager.syncTools), query via `discover()`.
 */
export class ToolDiscoveryIndex {
  private tools: Map<string, IndexedTool> = new Map();

  private key(serverId: string, name: string): string {
    return `${serverId}/${name}`;
  }

  add(serverId: string, name: string, description = ""): void {
    const haystack = `Service: ${serverId}. Tool: ${name}. ${description}`;
    this.tools.set(this.key(serverId, name), {
      serverId,
      name,
      description,
      haystack,
    });
  }

  remove(serverId: string, name: string): void {
    this.tools.delete(this.key(serverId, name));
  }

  /** Remove every tool belonging to a server (e.g. on disconnect). */
  removeServer(serverId: string): void {
    for (const k of [...this.tools.keys()]) {
      if (k.startsWith(`${serverId}/`)) this.tools.delete(k);
    }
  }

  size(): number {
    return this.tools.size;
  }

  all(): IndexedTool[] {
    return [...this.tools.values()];
  }

  discover(query: string, topN = 5): DiscoveryHit[] {
    const baseTokens = tokenize(query);
    if (baseTokens.length === 0) return [];

    // expand with synonyms — BIDIRECTIONAL: if `search` lists `find`, then a
    // query containing `find` also expands to `search` (and vice versa).
    const expanded = new Set(baseTokens);
    for (const t of baseTokens) {
      for (const syn of SYNONYMS[t] ?? []) expanded.add(syn);
      // reverse direction: find keys whose synonym list contains this token
      for (const [key, syns] of Object.entries(SYNONYMS)) {
        if (syns.includes(t)) expanded.add(key);
      }
    }
    const queryTokens = [...expanded];

    const scored: DiscoveryHit[] = [];
    for (const tool of this.tools.values()) {
      const nameTokens = new Set(tokenize(tool.name));
      const score = scoreTool(tool, nameTokens, queryTokens);
      if (score > 0) {
        scored.push({
          serverId: tool.serverId,
          name: tool.name,
          description: tool.description,
          score,
        });
      }
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topN);
  }
}
