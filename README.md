# Curse 🕯️

![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-f9f1e1?style=flat-square&logo=bun&logoColor=black)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)

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
<i>"onboarding is easy bro"</i><br/>
<div>- Aoi Todo</div>
</td>
</tr>
</table>

If the above made you cringe, then you're not alone because many others have too. Existing solutions to this problem have come in various forms. 

- [s(hell) Scripts](https://pythonspeed.com/articles/shell-scripts/): How do you view the ongoing output of each process?. You could hook into TMux or Wezterm panes but that isn't ideal for everyone.

- [docker-compose](https://github.com/docker/compose): Requires containerizing all local resources for your application. Not ideal unless you have a neckbeard.

- [process-compose](https://github.com/F1bonacc1/process-compose): Has a lot of features I don't use and feels sluggish.

Out of all of the solutions above, `process-compose` got the closest to the experience I wanted but was still far from it.

# Features Planned

- [ ] Support user input in the log view
- [ ] Dump logs to files

