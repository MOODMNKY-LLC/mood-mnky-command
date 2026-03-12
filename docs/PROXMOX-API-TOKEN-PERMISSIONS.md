# Proxmox API token permissions (Sys.Audit)

Your API token is accepted by PVE but returns **"Permission check failed (/, Sys.Audit)"** because the **user** that owns the token does not yet have permission on path `/`. In Proxmox, **API tokens inherit permissions from their user**; there is no separate "edit token permissions" in the API Tokens screen. You grant the **user** (or a group) a **role** at a **path** in the ACL. The token then has the same (or a subset of) permissions as that user.

References: Proxmox VE Administration Guide §14.7 Permission Management, §14.9.2 Auditors, §14.9.4 Limited API Token; `pveum(1)`.

---

## Option A: CLI (fastest, run on any cluster node as root)

SSH into any node (e.g. DATA-MNKY or CODE-MNKY) and run:

```bash
# Give user code-mnky@pam read-only access (includes Sys.Audit) on the whole cluster
pveum acl modify / -user code-mnky@pam -role PVEAuditor
```

**PVEAuditor** is a built-in role with read-only access, including:
- **Sys.Audit** — view node status/config, Corosync cluster config, HA config (what `/cluster/status` needs)
- VM.Audit, Datastore.Audit, etc., so the cluster dashboard and guest list will work.

**PVEAdmin** is also sufficient (and more capable): it includes Sys.Audit, VM.Monitor, and most VM/datastore access, but not full system/permission modification. If you already granted PVEAdmin to `code-mnky@pam`, the token will work for the cluster dashboard and guest list.

To verify:

```bash
pveum user permissions code-mnky@pam
```

You should see an entry for path `/` with role `PVEAuditor`.

---

## Option B: Web UI (Datacenter → Permissions, not API Tokens)

1. Log in to the Proxmox web UI (e.g. `https://10.0.0.10:8006`).
2. In the left tree, select **Datacenter** (the top-level "Datacenter" node).
3. Open the **Permissions** tab in the right-hand panel (same row as Summary, Cluster, etc.).  
   You should see a table of ACL entries (Path, User/Group/Token, Role, Propagate).  
   **Do not** use "API Tokens" here — that only creates/revokes tokens; it does not assign permissions.
4. Click **Add** (or "Add permission" / "Add ACL" depending on version).
5. In the dialog:
   - **Path:** choose **/** (root). This applies to the whole cluster.
   - **User:** select or type **code-mnky@pam** (the user that owns the `mnky-api` token).
   - **Role:** select **PVEAuditor** (read-only; includes Sys.Audit).
   - **Propagate:** leave enabled (default) so the permission applies to all objects under `/`.
6. Confirm / Add.

After that, the token `code-mnky@pam!mnky-api` will have the same read-only access as the user, and the CODE-MNKY app’s cluster/status and guest list calls should succeed.

---

## If you don’t see "Add" under Permissions

- Make sure you are on **Datacenter** in the tree and on the **Permissions** tab (not "Users", "Groups", or "Roles").
- Some versions use a single "Permissions" submenu under Datacenter; open that and look for the ACL table and an "Add" or "+" control.
- If the UI still doesn’t show it, use **Option A (CLI)** — it’s one command and works on all PVE versions.

---

## Optional: restrict the token to read-only (privilege separation)

By default the token has the same permissions as the user. If you want the token to be read-only even if you later give the user more rights:

```bash
# Enable privilege separation for the token (run once)
pveum user token set code-mnky@pam mnky-api -privsep 1

# Then give the token (not the user) the auditor role on /
pveum acl modify / -token 'code-mnky@pam!mnky-api' -role PVEAuditor
```

The user `code-mnky@pam` must still have at least PVEAuditor on `/` for the token to get it (tokens can only have a subset of the user’s permissions).

---

## Verify permissions (if it still fails)

On any cluster node as root, check what the user has:

```bash
pveum user permissions code-mnky@pam
```

You must see an entry for **path `/`** (root). If the only entries are for `/vms`, `/nodes/xyz`, or other paths, cluster-wide APIs like `/cluster/status` will still fail with "Permission check failed (/, Sys.Audit)". Add an ACL for path **/**:

```bash
pveum acl modify / -user code-mnky@pam -role PVEAdmin
```

If you granted PVEAdmin to a **group**, ensure `code-mnky@pam` is in that group:

```bash
pveum user list
pveum group list
# user's groups shown in user list; or: pveum user permissions code-mnky@pam
```

---

## Summary

| Goal                         | Where to do it              | What to set                                      |
|-----------------------------|-----------------------------|--------------------------------------------------|
| Fix "Permission check failed (/, Sys.Audit)" | User permissions (ACL), not API Tokens | User **code-mnky@pam**, path **/** (root), role **PVEAdmin** or **PVEAuditor** |
| Easiest method              | CLI on any node             | `pveum acl modify / -user code-mnky@pam -role PVEAdmin` |
| Still failing?              | Check path is **/**         | Run `pveum user permissions code-mnky@pam` and ensure path `/` is listed |
