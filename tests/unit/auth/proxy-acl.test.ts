import * as fs from 'fs';
import * as path from 'path';
import { AlsaniaMcp } from '../../../src/core/server';
import { MCPProxyManager } from '../../../src/proxy/mcp-proxy';
import { Acl, PermBits } from '../../../src/auth/acl';

const FIXTURE = `
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { ListToolsRequestSchema, CallToolRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const server = new Server({ name: 'fixture', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: 'echo', description: 'echo', inputSchema: { type: 'object', properties: { msg: { type: 'string' } } } }],
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => ({ content: [{ type: 'text', text: 'echo:' + req.params.arguments.msg }] }));
server.connect(new StdioServerTransport());
`;

describe('MCPProxyManager — ACL gating on callToolAs', () => {
  let fixturePath: string;
  let proxy: MCPProxyManager;
  let acl: Acl;

  beforeAll(async () => {
    const dir = path.join(__dirname, '..', '..', '..', '.tmp');
    fs.mkdirSync(dir, { recursive: true });
    fixturePath = path.join(dir, `acl-proxy-fixture-${Date.now()}.cjs`);
    fs.writeFileSync(fixturePath, FIXTURE);
  });

  afterAll(() => {
    if (fixturePath && fs.existsSync(fixturePath)) fs.unlinkSync(fixturePath);
  });

  beforeEach(async () => {
    const server = new AlsaniaMcp();
    proxy = new MCPProxyManager(server);
    acl = new Acl();
    proxy.acl = acl;
    await proxy.connectToServer({
      id: 'fixture', transport: 'stdio', command: process.execPath, args: [fixturePath],
    } as any);
  });

  afterEach(async () => {
    const instances: any = (proxy as any).instances;
    for (const [id] of instances) await proxy.disconnectServer(id).catch(() => {});
  });

  const alice = { type: 'user' as const, id: 'alice' };

  test('no ACL entries -> open (call succeeds for any principal)', async () => {
    const r = await proxy.callToolAs('fixture', 'echo', { msg: 'hi' }, alice);
    expect(JSON.stringify(r)).toContain('echo:hi');
  });

  test('ACL entry exists, principal lacks CALL -> Forbidden', async () => {
    acl.grantPermission({ type: 'user', id: 'bob' }, { type: 'tool', id: 'fixture/echo' }, { permBits: PermBits.VIEW });
    await expect(proxy.callToolAs('fixture', 'echo', { msg: 'hi' }, alice)).rejects.toThrow(/Forbidden/);
  });

  test('principal granted CALL -> allowed', async () => {
    acl.grantPermission(alice, { type: 'tool', id: 'fixture/echo' }, { permBits: PermBits.CALL });
    const r = await proxy.callToolAs('fixture', 'echo', { msg: 'yo' }, alice);
    expect(JSON.stringify(r)).toContain('echo:yo');
  });

  test('public CALL grant -> allowed for any principal', async () => {
    acl.grantPermission({ type: 'public' }, { type: 'tool', id: 'fixture/echo' }, { permBits: PermBits.CALL });
    const r = await proxy.callToolAs('fixture', 'echo', { msg: 'pub' }, alice);
    expect(JSON.stringify(r)).toContain('echo:pub');
  });
});
