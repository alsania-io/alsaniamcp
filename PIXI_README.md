# Pixi Python Environment Setup for AlsaniaMCP

This guide explains how to use Pixi for managing Python dependencies in AlsaniaMCP, replacing traditional virtual environment setups.

## 🚀 Getting Started with Pixi

### Prerequisites

- [Pixi installed](https://prefix.dev/docs/pixi/installation) on your system
- Basic understanding of Python environments

### Installation

1. **Install Pixi** (if not already installed):

```bash
# Using the recommended installation method
curl -fsSL https://prefix.dev/install | bash
```

2. **Initialize the Pixi environment**:

```bash
pixi install
```

This will create a virtual environment with all the required Python dependencies.

## 📦 Available Commands

The Pixi configuration includes several useful tasks:

### Development Tasks

- **Test Pixi setup**:
  ```bash
  pixi run test-pixi
  ```

- **Start the FastAPI router (development mode)**:
  ```bash
  pixi run start-router
  ```

- **Start the FastAPI router (production mode)**:
  ```bash
  pixi run start-router-prod
  ```

- **Run tests**:
  ```bash
  pixi run test
  ```

- **Format code**:
  ```bash
  pixi run format
  ```

- **Show environment info**:
  ```bash
  pixi run info
  ```

### Environment Management

- **Activate the Pixi environment**:
  ```bash
  pixi shell
  ```

- **List installed packages**:
  ```bash
  pixi list
  ```

- **Update dependencies**:
  ```bash
  pixi update
  ```

## 🔧 Configuration Details

The [`pixi.toml`](pixi.toml) file contains:

- **Python 3.10** as the base environment
- **FastAPI** for the router web framework
- **Uvicorn** as the ASGI server
- Development tools like pytest, black, and isort

## 🎯 Migration from Traditional Virtual Environments

If you were previously using `venv`, `virtualenv`, or `conda`, Pixi provides several advantages:

1. **Reproducible environments** - Exact dependency versions are pinned
2. **Cross-platform** - Works on Linux, macOS, and Windows
3. **Faster setup** - Uses conda-forge for optimized packages
4. **Task automation** - Built-in task runner for common operations

## 📝 Usage Examples

### Starting the Router

```bash
# Development mode with auto-reload
pixi run start-router

# Production mode
pixi run start-router-prod
```

### Running Tests

```bash
# Run all tests
pixi run test

# Run specific test file
pixi run python -m pytest tests/specific_test.py
```

### Code Formatting

```bash
# Format all Python code
pixi run format

# Check formatting without applying changes
pixi run black --check .
```

## 🔄 Updating Dependencies

To add new Python dependencies:

1. Edit the [`pixi.toml`](pixi.toml) file
2. Add the package under `[tool.pixi.dependencies]` or `[tool.pixi.dev-dependencies]`
3. Run `pixi update`

## 🐛 Troubleshooting

### Common Issues

- **Pixi not found**: Ensure Pixi is installed and in your PATH
- **Environment activation failed**: Run `pixi shell` to enter the environment
- **Missing dependencies**: Run `pixi install` to install all dependencies

### Cleaning Up

To remove the Pixi environment:

```bash
rm -rf .pixi-env
```

## 📚 Additional Resources

- [Pixi Documentation](https://prefix.dev/docs/pixi/overview)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [AlsaniaMCP Main Documentation](README.md)

## 🎉 Benefits of Pixi

✅ **Reproducible** - Exact same environment for all developers
✅ **Fast** - Optimized package installation
✅ **Modern** - Replaces outdated virtualenv workflows
✅ **Integrated** - Built-in task runner and environment management
✅ **Cross-platform** - Works everywhere

Enjoy your streamlined Python development experience with AlsaniaMCP! 🚀