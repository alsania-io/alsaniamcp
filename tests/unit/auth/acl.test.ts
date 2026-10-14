import { Acl, PermBits, Principal, Resource } from '../../../src/auth/acl';

describe('Acl — object-level permissions', () => {
  let acl: Acl;
  const alice: Principal = { type: 'user', id: 'alice' };
  const tool: Resource = { type: 'tool', id: 'git/status' };

  beforeEach(() => {
    acl = new Acl();
  });

  it('denies by default when no entry exists (default-deny)', () => {
    expect(acl.checkPermission(alice, tool, PermBits.VIEW)).toBe(false);
    expect(acl.effectiveBits(alice, tool)).toBe(PermBits.NONE);
  });

  it('grants and checks a permission', () => {
    acl.grantPermission(alice, tool, { permBits: PermBits.VIEW | PermBits.CALL });
    expect(acl.checkPermission(alice, tool, PermBits.VIEW)).toBe(true);
    expect(acl.checkPermission(alice, tool, PermBits.CALL)).toBe(true);
    expect(acl.checkPermission(alice, tool, PermBits.EDIT)).toBe(false);
  });

  it('requires ALL bits (bitwise AND semantics)', () => {
    acl.grantPermission(alice, tool, { permBits: PermBits.VIEW });
    expect(acl.checkPermission(alice, tool, PermBits.VIEW | PermBits.EDIT)).toBe(false);
  });

  it('unions public entry into every principal', () => {
    acl.grantPermission({ type: 'public' }, tool, { permBits: PermBits.VIEW });
    const bob: Principal = { type: 'user', id: 'bob' };
    expect(acl.checkPermission(bob, tool, PermBits.VIEW)).toBe(true);
    expect(acl.checkPermission(bob, tool, PermBits.CALL)).toBe(false);
  });

  it('unions group entries', () => {
    acl.grantPermission({ type: 'group', id: 'devs' }, tool, { permBits: PermBits.CALL });
    expect(acl.checkPermission(alice, tool, PermBits.CALL, ['devs'])).toBe(true);
    expect(acl.checkPermission(alice, tool, PermBits.CALL, [])).toBe(false);
  });

  it('resolves roles into bits', () => {
    acl.defineRole({ id: 'viewer', name: 'Viewer', resourceType: 'tool', permBits: PermBits.VIEW });
    acl.grantPermission(alice, tool, { roleId: 'viewer' });
    expect(acl.checkPermission(alice, tool, PermBits.VIEW)).toBe(true);
    expect(acl.checkPermission(alice, tool, PermBits.EDIT)).toBe(false);
  });

  it('rejects unknown roles and empty grants', () => {
    expect(() => acl.grantPermission(alice, tool, { roleId: 'nope' })).toThrow(/Unknown role/);
    expect(() => acl.grantPermission(alice, tool, {})).toThrow(/at least one bit/);
  });

  it('revokes permissions', () => {
    acl.grantPermission(alice, tool, { permBits: PermBits.VIEW });
    expect(acl.revokePermission(alice, tool)).toBe(1);
    expect(acl.checkPermission(alice, tool, PermBits.VIEW)).toBe(false);
    expect(acl.revokePermission(alice, tool)).toBe(0);
  });

  it('findAccessibleResources filters by type and required bits', () => {
    const tool2: Resource = { type: 'tool', id: 'gh/pr' };
    const serverRes: Resource = { type: 'mcpServer', id: 'eme' };
    acl.grantPermission(alice, tool, { permBits: PermBits.VIEW });
    acl.grantPermission(alice, tool2, { permBits: PermBits.VIEW | PermBits.CALL });
    acl.grantPermission(alice, serverRes, { permBits: PermBits.VIEW });

    const viewable = acl.findAccessibleResources(alice, 'tool', PermBits.VIEW).map((r) => r.id).sort();
    expect(viewable).toEqual(['gh/pr', 'git/status']);

    const callable = acl.findAccessibleResources(alice, 'tool', PermBits.CALL).map((r) => r.id);
    expect(callable).toEqual(['gh/pr']);

    const servers = acl.findAccessibleResources(alice, 'mcpServer', PermBits.VIEW).map((r) => r.id);
    expect(servers).toEqual(['eme']);
  });

  it('getPermissionsMap reports effective bits per resource', () => {
    acl.grantPermission(alice, tool, { permBits: PermBits.VIEW });
    acl.grantPermission({ type: 'public' }, tool, { permBits: PermBits.CALL });
    const map = acl.getPermissionsMap(alice);
    expect(map['tool:git/status']).toBe(PermBits.VIEW | PermBits.CALL);
  });

  it('grant is idempotent (updates, does not duplicate)', () => {
    acl.grantPermission(alice, tool, { permBits: PermBits.VIEW });
    acl.grantPermission(alice, tool, { permBits: PermBits.ADMIN });
    expect(acl.listResourcePermissions(tool).length).toBe(1);
    expect(acl.checkPermission(alice, tool, PermBits.ADMIN)).toBe(true);
  });
});
