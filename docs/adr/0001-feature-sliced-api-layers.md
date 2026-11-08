# Feature-sliced API layers

The API package had no layer boundaries: router files held SQL, business rules, and transport error construction at once, while the same domain concept was split across `routers/` and `lib/` — member content in one file, admin content in another, its rules in a third. We decided that each domain feature owns one folder holding its router handlers, its service, and its repository, and that `lib/` keeps only cross-cutting utilities.

## Considered Options

- **Keep `routers/` and `lib/`, add a repository beside each service.** Smallest diff, but preserves the scatter that motivated the change, and leaves admin and member surfaces of the same domain writing their own queries against the same tables.
- **Slice by router surface** (one folder per endpoint group, ~30). Each slice owns part of the same tables, so duplication survives.
- **Slice by domain concept** (chosen, ~10 folders). One folder owns a domain's tables for every surface, member and admin alike.

## Consequences

- **Repositories are the shared substrate; services are private.** A feature may import another feature's repository. It may never import another feature's service. Anything two features need moves down into a repository.
- The admin and member surfaces of a domain share one repository, which is where the current duplication of subject, content, and question queries disappears.
- Repositories are constructed bound to a database client, so a transaction instance is threaded by construction rather than by argument at every call site.
- Services throw a domain error carrying an oRPC error code; a single middleware translates it. Handlers contain no error handling, and `crud-helpers` and `TryoutError` are deleted.
- Every handler calls a service, including rule-free reads. A one-line delegate is cheaper than a per-procedure judgement about which layer to use.
- Middleware belongs to the router layer: it may import repositories, never services, and it may not hold business rules.

The domain error code set carries six codes, not the five the spec enumerated. `UNPROCESSABLE_CONTENT` was added because eight pre-existing failures were already surfaced as 422 responses, and without that code the constraint that no error code changed for any existing failure could not be met at those sites.
