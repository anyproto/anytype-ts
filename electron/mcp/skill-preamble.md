<!-- anytype-desktop:begin -->
## Connected by Anytype Desktop

Anytype set this skill up on this computer. Use `ANYTYPE_API_URL` and `ANYTYPE_API_KEY` from your environment and skip "Pair and make a first read" below.

- Base URL: `$ANYTYPE_API_URL`. Before the first request, check that it matches `http://127.0.0.1:<digits>` exactly; if it doesn't, stop and tell the user to reconnect. Do not assume the default port.
- Requests: `curl -q --noproxy '*' -sS "$ANYTYPE_API_URL/v2/…" -H "Authorization: Bearer $ANYTYPE_API_KEY"`. `-q` must be the first option (it skips `.curlrc`); `--noproxy '*'` keeps the request on this computer. Let the shell expand the variables.
- Windows without a POSIX shell (PowerShell): `curl.exe -q --noproxy '*' -sS "$env:ANYTYPE_API_URL/v2/…" -H "Authorization: Bearer $env:ANYTYPE_API_KEY"`.
- Never print, echo, log or write the value of `ANYTYPE_API_KEY`. Do not run `env`, `printenv`, `set` or `Get-ChildItem Env:` to inspect it, and do not use `curl -v` or `--trace`.
- First check: `curl -q --noproxy '*' -sS "$ANYTYPE_API_URL/v2/auth/whoami" -H "Authorization: Bearer $ANYTYPE_API_KEY"`.
- If either variable is missing, or the API answers 401: stop and tell the user "Open Anytype ▸ Settings ▸ AI apps ▸ Claude Code ▸ Reconnect, then start a new session." Never start pairing.
- If the API answers 403: this connection isn't allowed to do that. Tell the user they can change its access in Anytype ▸ Settings ▸ AI apps. Do not ask them to reconnect.
- If the connection is refused, ask the user to open Anytype.
<!-- anytype-desktop:end -->
