# dashview

## Repository Housekeeping

This repository includes a comprehensive `.gitignore` file that automatically excludes Python cache and build artifacts from version control. The following files and directories are ignored:

- Python bytecode files (`*.pyc`, `*.pyo`, `*.pyd`) and `__pycache__` folders
- Python virtual environments (`.env`, `.venv`, `env/`, `venv/`, etc.)
- Distribution and packaging files (`build/`, `dist/`, `*.egg-info`, etc.)
- IDE/editor-specific files (`.vscode/`, `.idea/`, temporary files)
- OS-specific files (`.DS_Store`, `Thumbs.db`)
- Home Assistant specific files (`home-assistant.log`, `home-assistant_v2.db`, `.storage/`)
- Log files (`*.log`)
- Jupyter notebook checkpoints and mypy cache

No action is required for setup regarding these ignored files - they will be automatically excluded from the repository.