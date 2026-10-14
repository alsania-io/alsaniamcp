/**
 * Object-level ACL for AlsaniaMCP.
 *
 * EXTRACTED (EME Storage Router Phase 4, 2026-10-12): the ACL model now lives
 * in the shared package `@alsania-io/acl` (github.com/alsania-io/acl). This file
 * is a thin re-export shim so existing imports (`.../auth/acl`) keep working
 * unchanged. NO duplication — the model has ONE owner.
 *
 * The original implementation is preserved at
 * `.deprecated/acl.ts.orig-20261012` for reference (never deleted).
 *
 * The shared package EXTENDS the original ResourceType with `namespace`,
 * `storage`, `secret` — a superset, so all prior usage remains valid.
 */

export {
  Acl,
  PermBits,
} from "@alsania-io/acl";

export type {
  Principal,
  PrincipalType,
  Resource,
  ResourceType,
  PermBit,
  Role,
  AclEntry,
} from "@alsania-io/acl";