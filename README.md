# dft - Depth-First Thinking

> Solve problems the depth-first way.

A terminal-based todo-list tool that manages workflows using tree structures with call-stack-inspired navigation. Decompose complex problems into sub-problems, navigate depth-first using keyboard shortcuts, track progress, and maintain focused context.

## Why dft?

- **Depth-first navigation** - Emphasize deep exploration along a single path
- **Keyboard-driven** - All navigation via arrow keys and shortcuts (no typed commands)
- **Focused context** - Always see current problem with children and sibling context
- **Cascading completion** - Marking a node done completes all descendants
- **Zeigarnik effect** - Keep unfinished tasks visible to manage cognitive load

## Installation

### Using Bun (recommended)

```bash
bun add -g depth-first-thinking
```

### Using npm

```bash
npm install -g depth-first-thinking
```

### From source

```bash
git clone https://github.com/alwalxed/dft.git
cd dft
bun install
bun link
```

## Quick Start

```bash
# Create a new project
dft new my-project "Build authentication system"

# Open the interactive TUI
dft my-project

# Or explicitly
dft open my-project
```

## Commands

| Command | Description |
|---------|-------------|
| `dft new <name> <title>` | Create a new project with root problem |
| `dft list` | List all projects |
| `dft open <name>` | Open project in interactive TUI |
| `dft <name>` | Shorthand for `dft open <name>` |
| `dft tree <name>` | Print tree structure to stdout |
| `dft delete <name>` | Delete a project |

### Options

```bash
dft delete <name> --yes    # Skip confirmation
dft tree <name> --no-status # Hide status markers
```

## Interactive TUI

The TUI shows your current problem with its children and navigation context:

```
┌─────────────────────────────────────────────────────┐
│ Root > Parent Problem                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│   [OPEN] Current Problem Title                      │
│                                                     │
│   Children (3):                                     │
│     • [ ] First sub-problem                         │
│     • [x] Second sub-problem                        │
│     • [ ] Third sub-problem                         │
│                                                     │
│   ↑ Previous Sibling Title                          │
│   ↓ Next Sibling Title                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│ ↑↓:siblings →:dive ←:back n:new e:edit d:done x:del│
└─────────────────────────────────────────────────────┘
```

### Key Bindings

| Key | Action |
|-----|--------|
| `↑` / `k` | Move to previous sibling |
| `↓` / `j` | Move to next sibling |
| `→` / `l` | Dive into first child |
| `←` / `h` | Go back to parent |
| `n` | Create new child problem |
| `e` | Edit current problem title |
| `d` | Toggle done status (cascades to children) |
| `x` | Delete current problem |
| `?` | Show help |
| `r` | Refresh display |
| `q` | Quit (auto-saves) |

### Navigation Mental Model

Think of it like navigating a file system:
- `←` / `→` = `cd ..` / `cd child` (depth)
- `↑` / `↓` = moving between items in `ls` output (siblings)

## Data Storage

Projects are stored as JSON files in platform-specific locations:

| Platform | Location |
|----------|----------|
| macOS | `~/Library/Application Support/depthfirst/projects/` |
| Linux | `~/.local/share/depthfirst/projects/` |
| Windows | `%APPDATA%\depthfirst\projects\` |

## Project Naming Rules

- 1-50 characters
- Letters, numbers, hyphens, and underscores only
- Must start with a letter or number
- Case-insensitive (stored as lowercase)

## Development

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0

### Setup

```bash
git clone https://github.com/alwalxed/dft.git
cd dft
bun install
```

### Commands

```bash
bun run dev          # Run with watch mode
bun run build        # Build standalone binary
bun run format       # Format code with Biome
bun run lint         # Lint code with Biome
bun run check-types  # TypeScript type checking
bun test             # Run tests
```

### Project Structure

```
src/
├── index.ts              # CLI entry point
├── commands/             # CLI commands
│   ├── new.ts
│   ├── list.ts
│   ├── delete.ts
│   ├── open.ts
│   └── tree.ts
├── tui/                  # Terminal UI
│   ├── app.ts
│   ├── renderer.ts
│   ├── navigation.ts
│   ├── modals.ts
│   └── components.ts
├── data/                 # Data layer
│   ├── types.ts
│   ├── storage.ts
│   └── operations.ts
└── utils/                # Utilities
    ├── validation.ts
    ├── platform.ts
    └── formatting.ts
```

## Technical Stack

- **Runtime:** [Bun](https://bun.sh/)
- **Language:** TypeScript
- **TUI:** [OpenTUI](https://github.com/anomalyco/opentui)
- **CLI:** [Commander.js](https://github.com/tj/commander.js)
- **Linting:** [Biome](https://biomejs.dev/)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/foo-feature`)
3. Commit your changes (`git commit -m 'Add foo feature'`)
4. Push to the branch (`git push origin feature/foo-feature`)
5. Open a Pull Request

## License

MIT(LICENSE)
