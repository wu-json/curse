# Curse 🕯️

![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Runs on Bun](https://img.shields.io/badge/Runs%20on-Bun-f9f1e1?style=flat-square&logo=bun&logoColor=black)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)
![Females Attracted](https://img.shields.io/badge/Females%20Attracted-0-red?style=flat-square)

Curse is a dead simple Terminal UI for running processes, configured through a single `curse.toml` file.

<img width="1146" height="885" alt="スクリーンショット 2025-09-27 午後7 49 04" src="https://github.com/user-attachments/assets/580b87e6-8823-4c18-b05e-6de15b810d2c" />

## Installation & Setup

Curse is a single binary and it's _definitely lightweight._ Not like I shoved bun in there or anything. 

1. Install the [wu-json/cursed-tools](https://github.com/wu-json/cursed-tools) Aqua registry. After installing the `cursed-tools` Aqua registry, curse should be available via `aqua g -i`.

> [!NOTE]
> If you haven't used [aqua](https://github.com/aquaproj/aqua) before, now is a good time to start.

2. Create your `curse.toml` and put it in your project root.

```toml
# curse.toml example
version = 0

[[process]]
name = "db-migrate"
command = "bun run examples/large/db-migrate.ts"

[[process]]
name = "seed-data"
command = "bun run examples/large/seed-data.ts"
deps = [{ name = "db-migrate", condition = "succeeded" }]

[[process]]
name = "database"
command = "bun run examples/large/mock-database.ts"
deps = [{ name = "seed-data", condition = "succeeded" }]

[[process]]
name = "api-server"
command = "bun run examples/large/api-server.ts"
env = { PORT = 8001, SERVICE_NAME = "API Server" }
readiness_probe = { type = "http", host = "127.0.0.1", path = "/health", port = 8001 }
deps = [{ name = "database", condition = "ready" }]

# Optional lifecycle hooks (note that these are both blocking)
[hooks]
startup = { name = "setup", command = "echo 'Setting up environment...'" }
shutdown = { name = "cleanup", command = "echo 'Cleaning up...'" }
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

# watch everything in monorepo
pnpm watch:all

# start local dev server
pnpm start:dev:local

# start client app
cd app/client yarn start
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

Coming from `k9s`, constantly having to context switch shortcuts between `k9s` and `process-compose` was unpleasant, especially given that they look so similar. The key-binds in curse are meant to feel warm and familiar so that anyone using vim motions should feel right at home.

## Configuration Reference

### curse.toml Specification

The `curse.toml` file uses TOML format to define processes, dependencies, and lifecycle hooks. Below is a complete specification of all available configuration options.

#### Top-Level Fields

```toml
version = 0  # Required: Must be 0 (only supported version)

[hooks]      # Optional: Lifecycle hooks
# ...

[[process]]  # Required: Array of process definitions
# ...
```

#### Process Definition

Each process is defined as a `[[process]]` table with the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the process. Used for dependencies and display. |
| `command` | string | Yes | Shell command to execute. Runs in a shell context. |
| `env` | object | No | Environment variables for the process. Keys are strings, values can be strings or numbers. |
| `deps` | array | No | Array of dependency objects. See [Dependencies](#dependencies) below. |
| `readiness_probe` | object | No | Health check configuration. See [Readiness Probes](#readiness-probes) below. |

**Example:**
```toml
[[process]]
name = "api-server"
command = "npm run dev"
env = { PORT = 8080, NODE_ENV = "development", DEBUG = "true" }
deps = [{ name = "database", condition = "ready" }]
readiness_probe = { type = "http", host = "127.0.0.1", path = "/health", port = 8080 }
```

#### Dependencies

Dependencies control the execution order of processes. Each dependency object has two fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Name of the process this depends on. Must reference an existing process. |
| `condition` | string | Yes | When to consider the dependency satisfied. One of: `"started"`, `"succeeded"`, or `"ready"`. |

**Dependency Conditions:**

- **`"started"`**: Dependent process starts as soon as the dependency process is running (any state after pending).
- **`"succeeded"`**: Dependent process waits for dependency to exit with code 0.
- **`"ready"`**: Dependent process waits for the readiness probe to pass (or just running if no probe defined).

**Example:**
```toml
[[process]]
name = "migrations"
command = "npm run db:migrate"

[[process]]
name = "api-server"
command = "npm start"
deps = [
  { name = "migrations", condition = "succeeded" }
]
```

#### Readiness Probes

Readiness probes are health checks that determine when a process is ready to accept traffic or be depended upon. Two types are supported:

##### HTTP Probe

Polls an HTTP endpoint until it returns a 200 OK response.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"http"`. |
| `host` | string | Yes | Hostname or IP address to connect to. |
| `path` | string | Yes | HTTP path to request (e.g., `"/health"`). |
| `port` | number | Yes | Port number to connect to. |

**Example:**
```toml
[[process]]
name = "web-server"
command = "python -m http.server 8000"
readiness_probe = { type = "http", host = "127.0.0.1", path = "/", port = 8000 }
```

##### Exec Probe

Runs a shell command repeatedly until it exits with code 0.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `type` | string | Yes | Must be `"exec"`. |
| `command` | string | Yes | Shell command to execute. |

**Example:**
```toml
[[process]]
name = "postgres"
command = "docker-compose up postgres"
readiness_probe = { type = "exec", command = "pg_isready -h localhost" }
```

#### Lifecycle Hooks

Hooks are special processes that run at specific points in the application lifecycle. Both hooks are **blocking** operations.

```toml
[hooks]
startup = { name = "setup", command = "npm install && npm run db:setup" }
shutdown = { name = "cleanup", command = "docker-compose down" }
```

##### Startup Hook

Runs before any processes start. If it fails (non-zero exit), Curse will exit.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name for the hook. Must be unique across all processes and hooks. |
| `command` | string | Yes | Shell command to execute. |

##### Shutdown Hook

Runs after all processes are killed (when user presses `q` or Curse exits). Runs regardless of whether processes succeeded or failed.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name for the hook. Must be unique across all processes and hooks. |
| `command` | string | Yes | Shell command to execute. |

### Validation Rules

The parser enforces these validation rules:

1. **Version must be 0**: Only version 0 is currently supported.
2. **Unique names**: All process names and hook names must be unique across the entire configuration.
3. **Valid dependencies**: All dependency references must point to actual processes defined in the config.
4. **No extra fields**: Unknown fields in the TOML will cause parsing to fail.

### Complete Example

```toml
version = 0

[hooks]
startup = { name = "install-deps", command = "npm install" }
shutdown = { name = "cleanup", command = "docker-compose down -v" }

[[process]]
name = "postgres"
command = "docker-compose up postgres"
readiness_probe = { type = "exec", command = "pg_isready -h localhost -p 5432" }

[[process]]
name = "redis"
command = "docker-compose up redis"
readiness_probe = { type = "exec", command = "redis-cli ping" }

[[process]]
name = "migrations"
command = "npm run db:migrate"
deps = [{ name = "postgres", condition = "ready" }]

[[process]]
name = "seed-data"
command = "npm run db:seed"
deps = [{ name = "migrations", condition = "succeeded" }]

[[process]]
name = "api-server"
command = "npm run dev:api"
env = { PORT = 3000, NODE_ENV = "development", DATABASE_URL = "postgresql://localhost:5432/dev" }
readiness_probe = { type = "http", host = "127.0.0.1", path = "/health", port = 3000 }
deps = [
  { name = "postgres", condition = "ready" },
  { name = "redis", condition = "ready" },
  { name = "seed-data", condition = "succeeded" }
]

[[process]]
name = "worker"
command = "npm run dev:worker"
env = { REDIS_URL = "redis://localhost:6379" }
deps = [
  { name = "redis", condition = "ready" },
  { name = "api-server", condition = "ready" }
]

[[process]]
name = "frontend"
command = "npm run dev:frontend"
env = { VITE_API_URL = "http://localhost:3000" }
deps = [{ name = "api-server", condition = "ready" }]
```
