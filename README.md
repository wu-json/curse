# Curse 🕯️

![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Made with Bun](https://img.shields.io/badge/Made%20with-Bun-f9f1e1?style=flat-square&logo=bun&logoColor=black)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)

Curse is a dead simple Terminal UI for running processes, configurable through incantations in a single `curse.toml` file.

<img src="https://ih1.redbubble.net/image.5538369487.3481/raf,360x360,075,t,fafafa:ca443f4786.jpg" width="250" alt="hello" title="hello" />

Local development often feels like a very special curse. If you've been writing code for a while, you're probably no stranger to instructions like this:

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

![please halp](https://media.tenor.com/tbQSXR4MGU0AAAAe/aoi-todo.png)

If the above made you cringe, then you're not alone because many others have too. Existing solutions to this problem have come in various forms. 

- *Single Command Shell Scripts*: Works but makes viewing output for each process difficult. You could hook into TMux or Wezterm panes but that isn't ideal for everyone.

- [docker-compose](https://github.com/docker/compose): Requires containerizing all parts of your application. Not ideal unless you have a neckbeard.

- [process-compose](https://github.com/F1bonacc1/process-compose): Works and was my daily driver for a bit, but has a lot of features that I don't use and doesn't have the most intuitive developer experience for interacting with logs. Also, for what I was using it for composition caused more pain than it was worth; especially given that everyone on my team wanted to run their local setups _slightly_ differently (e.g. with remote databases).

I've used all of the above before and nothing felt quite right, so I made my own.

# Features Planned

- [ ] Support user input in the log view
- [ ] Dump logs to files

