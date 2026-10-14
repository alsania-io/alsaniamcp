import { ToolDiscoveryIndex } from '../../../src/discovery/tool-index';

describe('ToolDiscoveryIndex — natural-language tool discovery (jarvis port)', () => {
  let idx: ToolDiscoveryIndex;

  beforeEach(() => {
    idx = new ToolDiscoveryIndex();
    idx.add('time-server', 'current_time_by_timezone', 'Get the current time in any timezone');
    idx.add('git', 'git_status', 'Show the working tree status of a git repository');
    idx.add('git', 'git_commit', 'Record changes to the git repository');
    idx.add('fs', 'read_file', 'Read the contents of a file from disk');
    idx.add('fs', 'write_file', 'Write or append content to a file');
  });

  it('indexes and counts tools', () => {
    expect(idx.size()).toBe(5);
  });

  it('finds the time tool from a natural-language query', () => {
    const hits = idx.discover('what time is it in tokyo');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0].name).toBe('current_time_by_timezone');
  });

  it('finds git tools for a version-control query', () => {
    const hits = idx.discover('show me repo status');
    expect(hits[0].serverId).toBe('git');
  });

  it('ranks name matches above description matches', () => {
    const hits = idx.discover('read a file');
    expect(hits[0].name).toBe('read_file');
  });

  it('expands synonyms (search -> find/lookup)', () => {
    idx.add('search-srv', 'web_search', 'Search the web');
    const hits = idx.discover('find something online');
    expect(hits.some((h) => h.name === 'web_search')).toBe(true);
  });

  it('tolerates typos via fuzzy matching', () => {
    const hits = idx.discover('git statuss');
    expect(hits.some((h) => h.name === 'git_status')).toBe(true);
  });

  it('respects topN', () => {
    const hits = idx.discover('git', 1);
    expect(hits.length).toBe(1);
  });

  it('returns empty for a non-matching query', () => {
    expect(idx.discover('xyzzy plugh')).toEqual([]);
  });

  it('returns empty for an empty query', () => {
    expect(idx.discover('')).toEqual([]);
  });

  it('removes a single tool', () => {
    idx.remove('git', 'git_status');
    expect(idx.size()).toBe(4);
    expect(idx.discover('git status').some((h) => h.name === 'git_status')).toBe(false);
  });

  it('removes all tools for a server on disconnect', () => {
    idx.removeServer('git');
    expect(idx.size()).toBe(3);
    expect(idx.discover('git').length).toBe(0);
  });
});
