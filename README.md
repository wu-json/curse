# Curse 🕯️

![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Runs on Bun](https://img.shields.io/badge/Runs%20on-Bun-f9f1e1?style=flat-square&logo=bun&logoColor=black)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)
![Females Attracted](https://img.shields.io/badge/Females%20Attracted-0-red?style=flat-square)

Curse is a dead simple Terminal UI for running processes, configurable through incantations in a single `curse.toml` file.

<img width="1146" height="885" alt="スクリーンショット 2025-09-27 午後7 49 04" src="https://github.com/user-attachments/assets/580b87e6-8823-4c18-b05e-6de15b810d2c" />

## Installation & Setup

Curse is a single binary and it's _definitely lightweight._ Not like bun is bundled in there or anything.

1. `brew install curse`

2. Create your `curse.toml` and put it in your project root.

```toml
# curse.toml example
[[process]]
name = "db-migrate"
command = "bun run examples/large/db-migrate.ts"

[[process]]
name = "seed-data"
command = "bun run examples/large/seed-data.ts"
deps = ["db-migrate"]

[[process]]
name = "database"
command = "bun run examples/large/mock-database.ts"
deps = ["seed-data"]

[[process]]
name = "api-server"
command = "bun run examples/large/api-server.ts"
env = { PORT = 8001, SERVICE_NAME = "API Server" }
readiness_probe = { type = "http", host = "127.0.0.1", path = "/health", port = 8001 }
deps = ["seed-data"]
```

3. Run `curse`.

> [!NOTE]
> Curse will select a configuration file with the following priority from highest to lowest:
>
> `[override with -p flag]` > `curse.local.toml` > `curse.toml`.

## The Origin Story

<img src="https://ih1.redbubble.net/image.5538369487.3481/raf,360x360,075,t,fafafa:ca443f4786.jpg" width="180" alt="jjk-cute-demons" align="right" />

_Local development feels like a very special curse at times._ Just like these kind caring friends on the right.

If you've been writing code for a while, you're likely no stranger to the sacred art that is reading unmaintained instructions in the company `README.md`.

<br clear="right" />
<br />

```
## Starting Application Locally

# start local pg and redis
docker compose up

# build everything in monorepo
pnpm build:all

# start local dev server
pnpm start:dev:local

# start client app
cd app/client yarn start

# start
```

<table>
<tr>
<td><img src="https://media.tenor.com/tbQSXR4MGU0AAAAe/aoi-todo.png" width="300" alt="aoi-todo" /></td>
<td style="vertical-align: middle; padding-left: 20px;">
<i>"just run it locally bro"</i><br/>
<div>- Aoi Todo</div>
</td>
</tr>
</table>

If the above made you cringe, then you're not alone because many others have too. Existing solutions to this problem have come in various forms. 

- [s(hell) Scripts](https://pythonspeed.com/articles/shell-scripts/): How do you view the ongoing output of each process?. You could hook into TMux or Wezterm panes but that isn't ideal for everyone.

- [docker-compose](https://github.com/docker/compose): Requires containerizing all local resources for your application. Not ideal unless you have a neckbeard.

- [process-compose](https://github.com/F1bonacc1/process-compose): Has a lot of features I don't use and feels sluggish.

Out of all of the options above, `process-compose` got the closest to the experience I wanted but was still far from it. It felt quite slow, had limited tooling around logging, and resulted in composed configuration files that were unpleasant to maintain. 

## Design Principles

### Simplicity: Focus on the Local Development Use-Case

Scoping curse to the local development script use-case means we can drop a lot of the beefier orchestration features that `process-compose` has (e.g. replicas, process forking, etc.). This keeps the feature-set of curse minimal and allows us to focus on a relatively simple DX.

### Make Interacting with Logs Delightful

Local logs are really useful, and are often the reason we want to run things locally in the first place. Navigating and interacting with logs should feel like a first-class experience.

### Familiarity

Coming from `k9s`, constantly having to context switch shortcuts between `k9s` and `process-compose` was unpleasant, especially given that they look so similar. The key-binds in curse are meant to feel warm and familiar such that anyone using vim motions should feel right at home.

# Features Planned

- [ ] **Support user input in the log view**: This could be useful for managing processes that could require user input or confirmation (e.g. coding agents).
- [ ] **Dump logs to files**: For debugging processes with copious logs, have a log dump would be useful for retaining logs that exceed the `LogBuffer` size.

