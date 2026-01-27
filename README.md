# dft // depth-first-thinking

A terminal-based task manager with depth-first navigation. Break down tasks into subtasks, navigate recursively, and track progress.

## Installation

```bash
bun add -g depth-first-thinking
```

## Commands

| Command | Description |
|---------|-------------|
| `dft new <name>` | Create a new project |
| `dft list` | List all projects |
| `dft open <name>` | Open project in TUI |
| `dft <name>` | Shorthand for `dft open <name>` |
| `dft tree <name>` | Print tree structure |
| `dft delete <name>` | Delete a project |

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
