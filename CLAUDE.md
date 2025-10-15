# Curse - Repository Overview

## What is Curse?

Curse is a Terminal UI (TUI) application for managing and orchestrating local development processes through a simple TOML configuration file. It provides a delightful experience for viewing logs, managing process dependencies, and running complex local development environments.

## Core Features

- **Simple Configuration**: Single `curse.toml` file defines all processes
- **Dependency Management**: Processes can depend on others with conditions (started, succeeded, ready)
- **Readiness Probes**: HTTP and exec-based health checks for services
- **Process Lifecycle Hooks**: Optional startup and shutdown hooks
- **Rich Log Viewing**: First-class log viewing experience with vim-like keybindings
- **Resource Monitoring**: CPU and memory usage tracking for running processes
- **Environment Variables**: Per-process environment configuration

## Architecture

### Technology Stack

- **Runtime**: Bun (TypeScript/JavaScript runtime)
- **UI Framework**: Ink (React for CLIs)
- **CLI Framework**: gunshi
- **Configuration**: TOML with arktype validation
- **Search**: MiniSearch for log filtering

### Project Structure

```
src/
├── index.ts              # CLI entry point and config resolution
├── parser.ts             # TOML config parsing and validation
├── env.ts                # Environment configuration
├── version.ts            # Version management
├── hooks/                # React hooks for UI state management
│   ├── useProcessManager.tsx  # Core process orchestration logic
│   ├── useProgramState.tsx    # Global program state
│   ├── usePage.tsx            # Page navigation
│   ├── useAltScreen.tsx       # Terminal alternate screen
│   └── useRenderTick.tsx      # Render optimization
├── ui/                   # UI components and views
│   ├── View.tsx          # Root view component
│   ├── components/       # Reusable UI components
│   │   ├── ShortcutFooter.tsx
│   │   └── LogTailPreview.tsx
│   └── views/            # Main page views
│       ├── MainPage.tsx  # Process list view
│       └── LogPage.tsx   # Log viewing interface
└── lib/                  # Core utilities
    ├── LogBuffer.ts      # Efficient log buffering with dequeue
    ├── LogProcessing.ts  # Log parsing and processing
    ├── Dequeue.ts        # Dequeue data structure
    ├── Colors.ts         # Terminal color utilities
    └── invariant.ts      # Runtime assertions
```

## Key Components

### Process Management (useProcessManager.tsx:1)

The heart of Curse's orchestration system. Handles:
- Process lifecycle (spawn, kill, restart)
- Dependency resolution and execution ordering
- Readiness probes (HTTP and exec)
- Resource profiling (CPU/memory monitoring)
- Lifecycle hooks (startup/shutdown)

**Process States**: pending → starting → running → success/error/killed

### Log System

**LogBuffer** (lib/LogBuffer.ts:1): Fixed-size circular buffer using a dequeue for efficient log storage and retrieval. Supports:
- O(1) append operations
- Efficient line-by-line access
- Memory-bounded storage (default 5,000 lines)

**LogProcessing** (lib/LogProcessing.ts:1): Handles ANSI escape sequences, color parsing, and log line formatting.

### Configuration (parser.ts:1)

Uses arktype for runtime validation of TOML configs. Validates:
- Process definitions and dependencies
- Readiness probe configurations
- Lifecycle hooks
- Environment variables
- No duplicate names or invalid dependency references

## Configuration Example

```toml
version = 0

[[process]]
name = "database"
command = "docker-compose up postgres"
readiness_probe = { type = "http", host = "127.0.0.1", path = "/health", port = 5432 }

[[process]]
name = "api-server"
command = "npm run dev"
env = { PORT = 8080, NODE_ENV = "development" }
deps = [{ name = "database", condition = "ready" }]

[hooks]
startup = { name = "setup", command = "npm install && npm run migrate" }
shutdown = { name = "cleanup", command = "docker-compose down" }
```

## Process Dependencies

Three dependency conditions:
- **started**: Dependent runs when dependency is running (any state after pending)
- **succeeded**: Dependent waits for dependency to exit successfully (exit code 0)
- **ready**: Dependent waits for readiness probe to pass (or running state if no probe)

## Readiness Probes

**HTTP Probe**: Polls an HTTP endpoint until it returns 200 OK
```toml
readiness_probe = { type = "http", host = "127.0.0.1", path = "/health", port = 8080 }
```

**Exec Probe**: Runs a shell command until it exits with code 0
```toml
readiness_probe = { type = "exec", command = "pg_isready -h localhost" }
```

## Key Bindings

- **j/k**: Navigate process list (vim-style)
- **Enter**: View process logs
- **r**: Restart selected process
- **x**: Kill selected process
- **q**: Quit (triggers shutdown hook)
- **/** or **Ctrl+F**: Search logs
- **Esc**: Exit current view

## Development

### Building
```bash
bun install
bun run src/index.ts -p examples/basic/curse.toml
```

### Testing Examples
The `examples/` directory contains various test scenarios:
- `basic/`: Simple process configuration
- `deps/`: Dependency chain testing
- `hooks/`: Lifecycle hook examples
- `large/`: Complex multi-service setup
- `exec-probe/`: Exec-based readiness probes

## Environment Variables

- `LOG_BUFFER_SIZE`: Maximum lines per process log buffer (default: 5000)

## Design Philosophy

1. **Simplicity**: Focus on local development use case, not production orchestration
2. **Log-First**: Make log viewing and navigation a delightful experience
3. **Familiarity**: vim-like keybindings and k9s-inspired UI
4. **Performance**: Efficient log buffering and minimal re-renders

## Distribution

Distributed via the [wu-json/cursed-tools](https://github.com/wu-json/cursed-tools) Aqua registry as a single binary with embedded Bun runtime.
