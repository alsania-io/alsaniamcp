# sigma-lab Adoption Roadmap

> **Status:** proposal — 2026-10-04
> **Owner:** Aegis (`agent-1762537416905-h2i52nyo2`)
> **Source memories:** EME `204d55d7` (eval), `527d32a1` (recon conclusion), `ac49cb31` (agent-comms), `2e2516c1` (cli-source)
> **Sources:** `/home/sigma/Desktop/insidedev/sigma-lab/`

## 0. Thesis

AlsaniaMCP is a **dynamic MCP proxy + gateway + A2A trust layer** — not a tool
container. It already has transport (STDIO/HTTP/SSE/Streamable), A2A identity
(Ed25519, HITL, Trust Codes, InjectionGuard), an agent-framework (registry,
queues, heartbeat :8001), and basic comms (send_message/broadcast/check).

**We do not build new systems.** We adopt four things as *layers / plugins* into
the existing proxy architecture, plus two ergonomics lifts for EME.

> Enabling fact: the stdio proxy blocker (`v3Schema.safeParse`) was fixed
> 2026-10-04 (commit `8499667`). AlsaniaMCP can now proxy ANY stdio MCP server —
> which is exactly how we adopt agent-comms and any-cli. The roadmap is now
> *unblocked*, not just planned.

## 1. Adoptions (ranked)

| # | Adopt | Into | Priority | Effort |
|---|---|---|---|---|
| 1 | agent-comms mesh | AlsaniaMCP transport layer | HIGH | M |
| 2 | any-cli-mcp-server | AlsaniaMCP CLI-source plugin | HIGH | **done** |
| 3 | jarvis-registry ACL concepts | AlsaniaMCP `permissions` | HIGH (study) | M |
| 4 | toolbox OAuth *concept* (3rd-party, port don't depend) | AlsaniaMCP (UCAI servers) | MED | M |
| 5 | memo-master `doctor` + lean recall | EME | MED-HIGH | S |
| 6 | alsania-agent-swarm | unify w/ agent-comms | MED-HIGH | L |

### 1.1 agent-comms → transport layer (the wire)

**What it is (verified 2026-10-04):** `agent-comms@8.6.1`, published npm,
`bin: agent-comms -> dist/cli.js`, **stdio** transport, `type: module`.
Cross-harness TCP mesh: rooms, DMs, presence, visibility. Bridges live in
`src/bridges/{mcp,cc-peer,codex,claude-code,opencode,user,pi}`. Mesh primitives
come from external published pkgs (`wire-mesh-core`, `cc-peer`).

**Why:** AlsaniaMCP's comms are CENTRALIZED (registry, queues, heartbeat :8001).
agent-comms is DECENTRALIZED (every MCP instance = peer; no daemon, no fs).
It fits the sovereignty ethos better and fills gaps: P2P mesh, rooms+presence,
offline delivery replay.

**Division of labour:** *agent-comms = the wire; AlsaniaMCP `a2a/` = trust.*

**How (no code merge):** run agent-comms as a **stdio MCP server** and connect
AlsaniaMCP to it via the (now-working) proxy.

> **UPDATE 2026-10-04 — already implemented.** `src/index.ts` (~line 153) already
> connects agent-comms: spawns `node <agent-comms>/dist/cli.js bridge mcp` as a
> stdio MCP child, gated by `AGENT_COMMS_ENABLED=true`. This block was silently
> failing before commit `8499667` (the safeParse bug); it works now. So the
> *transport* half of #1 is **done** — remaining work is only the *trust/`a2a`*
> reconciliation and deciding F1.

Risk: agent-comms pulls React/Mantine/`@orpc` for its UI — we use only the
stdio mesh entry, never vendor the UI (Code v3.0: no React by default).

### 1.2 any-cli-mcp-server → CLI-source plugin — ✅ EFFECTIVELY DONE

**What it is:** `any-cli-mcp-server` — turns any CLI into MCP by parsing
`--help` (deps: `parse-help`, `shell-quote`, `zod`; `bin: dist/index.mjs`).

**Status:** AlsaniaMCP already has `src/proxy/cli-source.ts`
(`cliSourceConfig`/`cliSources`, injection guard, cacheFile) which builds configs
calling `npx -y any-cli-mcp-server <cli>`. **Integration test now PASSES end-to-end**
(`tests/integration/cli-source.integration.test.ts`, live `git` CLI, 2/2) — this
only became possible after commit `8499667`.

**Remaining:** wire `cliSourceConfig` into `src/index.ts` so a CLI source is a
first-class proxy target at boot. Effort: S.

### 1.3 jarvis-registry → ACL concepts (study-only, do NOT run its stack)

**What it is:** enterprise MCP+A2A gateway. **Do not deploy** its Docker/Keycloak
stack (Code v3.0: no Docker; Podman only if required).

**Steal:** (a) fine-grained **tool-level ACL** (AlsaniaMCP has JWT only),
(b) **semantic skill discovery**, (c) **OTel audit**. Fold into the existing
`permissions.mjs` / auth layer — no new system.

**How:** read `jarvis-registry-main/` for the ACL + discovery design; port the
*concepts* into AlsaniaMCP's auth. Risk: scope creep — timebox to concepts only.

### 1.4 toolbox → OAuth token model (for the 19 UCAI servers)

> **UPDATE 2026-10-04 — partially pre-empted, scope narrowed.**
> `@alsania-io/api-client-kit@0.3.3` (published) ALREADY implements a full
> **client-side** OAuth2 engine: 1911 lines across 7 `src/auth/` modules,
> `oauth4webapi`, four flows (client-credentials, password, device-code,
> auth-code+PKCE), persistent token store, env derivation. Extracted from
> `openapi-dynamic-mcp` (MIT). **So we do NOT need toolbox for outbound API auth.**
>
> **toolbox is a different thing:** *MCP-server-side* OAuth — its selling point is
> "access/refresh tokens stay on the server, never sent to the frontend" and "one
> OAuth client per OAuth server." That is the **MCP OAuth spec flow** for an agent
> connecting to **authenticated MCP servers** — which api-client-kit does NOT cover.
>
> **toolbox is THIRD-PARTY (not ours):** Clerk Inc, MIT, `github.com/clerk/toolbox`,
> npm `toolbox@0.2.0`, **pre-1.0 (no semver guarantees)**. Adopting it = taking an
> external dependency in a security-critical path.
>
> **Narrowed + revised action:** for the 19 UCAI servers we need *MCP-server-side*
> OAuth (tokens stay server-side). Per Code v3.0 (sovereignty, no gated deps),
> **prefer porting the concept** — a server-side token handler — into AlsaniaMCP's
> auth layer, rather than depending on Clerk's pre-1.0 package. Read toolbox for the
> design; implement our own; do NOT add it as a runtime dep. Contrast with
> `api-client-kit`, which IS ours and already covers the client side.
> Effort: M (port, not S/depend). Depends on: UCAI server list.

## 2. EME ergonomics (EME stays the ultimate memory system)

- **memo-master `doctor` self-check** — adopt the *idea*: a health/self-check
  command for EME (Qdrant reachable, collection `am2` green, embedding strip OK).
- **token-lean recall** — memo-master's compact recall ergonomics; EME already
  strips embeddings (~150k -> ~3k tokens/10 results). Steal anything better.
- Effort: S each. Owner: EME. No architectural change.

## 3. The one strategic move: unify the agent-mesh story

`agent-comms` + `alsania-agent-swarm` + AlsaniaMCP all touch multi-agent. They
are **layers, not competitors**:

```
  alsania-agent-swarm   -> orchestration (decompose/route/parallel/synthesize)
  agent-comms           -> transport     (P2P mesh: rooms, DMs, presence, offline)
  AlsaniaMCP a2a/       -> trust         (Ed25519, HITL, Trust Codes, guard)
  AlsaniaMCP proxy/     -> tools         (dynamic MCP aggregation)
```

**Action:** write ONE design that positions these four as a stack. Revive
`alsania-agent-swarm` (Alsania's own; OpenRouter routing) and express its
coordination over agent-comms. Effort: L — own session.

## 4. Archive (park — do NOT build on)

| Project | Why park |
|---|---|
| `art-box_backup` | superseded by `mcp-code-mode` |
| `automcp` | frameworks unused |
| `@mcp-workbench` | minimal |
| `voicemode` | Python, mobile-only; revisit someday |

## 5. Proposed sequence

1. ✅ **Wire `cliSourceConfig` into `src/index.ts`** (S) — DONE 2026-10-04, commit
   `3416d9f`. Opt-in via `ALSANIA_CLI_SOURCES=git,gh,docker`.
2. ✅ **agent-comms as stdio proxy source** (M) — already in `src/index.ts`,
   now functional post-`8499667`. Remaining: trust/`a2a` reconciliation (F1).
3. **EME `doctor` + lean recall** (S) — parallelizable, independent.
4. **jarvis ACL concepts study** (M) — needs Sigma input on auth scope.
5. **toolbox OAuth for UCAI** (S) — needs the UCAI server list.
6. **Agent-mesh unification design** (L) — own session, needs Sigma.

## 6. Forks needing Sigma

- **F1:** agent-comms — run as *external peer server* (my rec, zero merge) vs
  *vendoring the mesh core* into AlsaniaMCP?
- **F2:** jarvis ACL — adopt tool-level ACL now, or defer until OAuth (#5) lands
  so both auth changes ship together?
  → *Revised 2026-10-04:* the OAuth **client-side** foundation already exists
  (`api-client-kit`). Only the **MCP-server-side** piece (toolbox, #1.4) is open.
  So jarvis ACL could layer on now without waiting — the blocker is gone.
- **F3:** agent-mesh unification — is `alsania-agent-swarm` worth reviving, or
  retire it and let agent-comms be the whole coordination story?

## 7. Concept adoptions into AlsaniaMCP (no external deps)

Both `agent-comms` and `jarvis-registry` are **third-party**. We adopt their
*concepts* into AlsaniaMCP; we do not depend on either at runtime.

### 7.1 jarvis ACL → `src/auth/acl.ts` (object-level permissions)

**Gap it fills:** AlsaniaMCP auth is JWT-only + route-level `requiresAuth`
booleans. No object-level permissions. jarvis has a clean, portable ACL model.

**Port this model (renamed to Alsania terms):**
- **Principal**: `{ type: 'user'|'group'|'public', id?: string }`
- **Resource**: `{ type: 'mcpServer'|'tool'|'agent'|'prompt', id: string }`
- **PermBits**: `VIEW=1`, `CALL=2`, `EDIT=4`, `ADMIN=8` (bitmask)
- **Role**: named `PermBits` set bound to a resource type
- **AclEntry**: `{ principal, resource, permBits, roleId?, grantedBy?, grantedAt }`

**Core ops (mirror jarvis service):**
`grantPermission`, `revokePermission`, `checkPermission`,
`findAccessibleResources`, `getPermissionsMap`, `listResourcePermissions`.

**Mapping to AlsaniaMCP:** JWT `sub`/claims → principal. The proxy/gateway,
when dispatching a tool call, checks `checkPermission(principal, {type:'tool',
id: serverId+'/'+toolName}, CALL)`. Default-deny for non-`public` resources;
`public`/`VIEW` preserved for current open behavior to avoid breakage.

**Storage:** start in-memory + optional JSON file (no Mongo). Zero deps.
**Effort:** M. **Depends on:** nothing (F2 cleared).

### 7.2 agent-comms → presence + rooms + offline replay (concepts)

**Already wired** as an external stdio MCP child (§1.1). Adopt its *concepts*
where AlsaniaMCP's own comms are thin:
- **Presence**: peer last-seen/status (AlsaniaMCP has heartbeats — extend to
  advertise `online/busy/offline` per peer).
- **Rooms**: named multi-peer channels layered on existing `broadcast`.
- **Offline replay**: queue messages for absent peers; deliver on reconnect
  (AlsaniaMCP has queues but no replay-on-reconnect).

**Effort:** M. **Depends on:** F1 (external-peer vs vendor) for the *transport*;
but the *concepts* can be prototyped against the existing `a2a/` layer
independently of F1.
