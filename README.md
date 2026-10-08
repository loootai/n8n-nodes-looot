# n8n-nodes-looot

n8n community node for [looot](https://looot.ai): one account and one prepaid balance for 2,500+ data
endpoints (find and verify emails, enrich companies, Google results, news, and more).

## Install for agents

```bash
claude mcp add --transport http looot https://api.looot.ai/mcp
```

n8n community node: n8n-nodes-looot (source only, not yet on npm)

See also: [awesome-looot-use-cases](https://github.com/loootai/awesome-looot-use-cases) (copy-paste recipes) and [awesome-gtm](https://github.com/loootai/awesome-gtm) (open-source GTM tools).

Status: source only. Not published to npm, not submitted to the n8n Creator Portal.

## Operations

| Operation | REST route | Cost |
|---|---|---|
| Search Catalog | `GET /v1/catalog/search?q=` | free |
| Inspect Endpoint | `GET /v1/operations/{endpointId}` (also works with `job:<id>`) | free |
| Run | `POST /v1/runs` with `endpointId`, `input`, `idempotencyKey`, `fallback`, `wait` | spends credit |
| Get Run | `GET /v1/runs/{runId}` | free |
| Balance | `GET /v1/balance` | free |

The catalog search route is GET only. Run sends `endpointId` as an endpoint id or `job:<job id>`,
for example `job:people.email.find`. With Fallback on, looot tries the next provider of the same job when
the first finds nothing. If you leave Idempotency Key empty the node uses `n8n-<execution id>-<item index>`.

The node sets `usableAsTool: true`, so an AI Agent can call it as a tool (set
`N8N_COMMUNITY_PACKAGES_ALLOW_TOOL_USAGE=true` on self-hosted n8n).

## Credential

`looot API`: an agent token from the dashboard (Settings, Agent tokens) with `catalog.read`, `runs.read`,
`runs.execute`, `usage.read`, and the base URL (default `https://api.looot.ai`). The credential test calls
`GET /v1/balance`.

## Develop

```bash
npm install
npm run lint
npm run build
npm run dev      # n8n with the node loaded, hot reload
```

Dependencies are pinned to exact versions and the project sets `ignore-scripts=true`.

## Publish (not done)

n8n requires community nodes to be published from GitHub Actions with provenance. `.github/workflows/publish.yml`
runs `npm publish --provenance --access public` on a version tag. It needs this folder to be its own public
GitHub repo and npm trusted publishing (or an `NPM_TOKEN` secret). Then submit the package in the n8n Creator
Portal. See https://docs.n8n.io/integrations/creating-nodes/build/reference/verification-guidelines/.
