# dft // depth-first-thinking

A terminal-based task manager with depth-first navigation. Break down tasks into subtasks, navigate recursively, and track progress.

## Installation

```bash
bun add -g depth-first-thinking
```

## Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `dft new <name>` | `create`, `init`, `add` | Create a new project |
| `dft list` | `ls`, `show`, `projects` | List all projects sorted by creation date |
| `dft open <name>` | `use`, `start`, `run` | Launch the interactive TUI session |
| `dft <name>` | - | Shorthand for `dft open <name>` |
| `dft tree <name>` | `view` | Print the tree structure to stdout |
| `dft delete <name>` | `rm`, `remove` | Delete an existing project |
| `dft update` | `upgrade`, `check-update` | Check for updates to dft |

### Options

- `dft delete <name> --yes` - Skip confirmation prompt when deleting
- `dft tree <name> --show-status` - Show status markers (default: true)
- `dft tree <name> --no-status` - Hide status markers

### Default Behavior

Running `dft` without any arguments will:
- Open the most frequently opened project if one exists
- Otherwise, list all projects

## Navigation

- `↑` `↓` - Select task
- `→` `Space` `Enter` - Enter task / view subtasks
- `←` - Go back to parent
- `n` - New subtask
- `e` - Edit task title
- `d` - Toggle done status
- `x` - Delete task
- `q` - Quit

## Task Display

- `[N]` - Total subtasks (all descendants)
- `(done)` - Task and all subtasks complete
- `(done, partial)` - Task done but some subtasks incomplete

## Development

```bash
git clone https://github.com/alwalxed/dft.git
cd dft
bun install
```

## License

[MIT](LICENSE)
