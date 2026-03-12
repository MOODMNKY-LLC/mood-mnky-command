Task: Extract repeated Liquid/HTML markup into a snippet.

Steps:
1) Identify duplicated markup and its variable dependencies.
2) Create a new snippet in `snippets/` with a clear name.
3) Replace duplicates with `{% render 'snippet-name', ... %}` and pass required variables explicitly.
4) Ensure no schema or block behavior changes.

Output:
- Patch summary
- Snippet file created
- Call sites updated
- What to test manually
