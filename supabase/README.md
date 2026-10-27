# Supabase

`schema.sql` is the complete schema for a new project. Run the whole file once in the Supabase SQL editor (or with the Supabase connector's `apply_migration`). Nothing else is needed: there is no migrations folder in this template.

## Required after running schema.sql

Insert the single config row, **before the owner's first sign-in** (SETUP.md has the exact step):

```sql
insert into private.job_agent_config (secret_sha256, owner_email)
values (encode(extensions.digest('<JOB_AGENT_SECRET>', 'sha256'), 'hex'), '<owner email>');
```

- `owner_email` is the only account that can sign up and read data. `public.is_owner()` checks it in every restrictive row-level-security policy. Use the same address as `ownerEmails` in `public/shared/config.js`.
- A trigger on `auth.users` (`only_owner_signup`) rejects every other sign-up. With no config row, all sign-ups are blocked, so the order matters: schema, then this row, then sign in.
- `<JOB_AGENT_SECRET>` is the shared secret for the job scan (`public.job_agent_rpc`); only its hash is stored. Put the same secret in the Vercel environment variable `JOB_AGENT_SECRET`.

## Changing the schema later

Edit `schema.sql` to the new final state and apply the change to the live project with a new migration (`apply_migration` or the SQL editor). Keep `schema.sql` as the file that rebuilds a fresh project.
