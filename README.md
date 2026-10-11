<p align="center"><img src="assets/hero.png" alt="n8n-nodes-looot: looot as an n8n node" width="100%"></p>

# n8n-nodes-looot

[![License](https://img.shields.io/github/license/loootai/n8n-nodes-looot)](LICENSE) [![Docs](https://img.shields.io/badge/docs-docs.looot.ai-12A06A)](https://docs.looot.ai)

n8n community node for [looot](https://looot.ai): one account and one prepaid balance for 2,500+ data
endpoints (find and verify emails, enrich companies, Google results, news, and more).

## Install

In n8n, open Settings, then Community Nodes, then Install, and enter `n8n-nodes-looot`. The package is on [npm](https://www.npmjs.com/package/n8n-nodes-looot).

See also: [awesome-looot-use-cases](https://github.com/loootai/awesome-looot-use-cases) (copy-paste recipes) and [awesome-gtm](https://github.com/loootai/awesome-gtm) (open-source GTM tools).

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

## Publish

`.github/workflows/publish.yml` publishes from GitHub Actions with provenance, which n8n requires for
verified community nodes. Auth is npm trusted publishing, so the repo stores no token. To release, bump
`version` in `package.json`, commit, and push a tag with the same number, for example `0.1.1`.
