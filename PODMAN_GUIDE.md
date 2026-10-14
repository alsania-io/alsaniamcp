# Podman Deployment Guide for AlsaniaMCP

This guide provides comprehensive instructions for deploying AlsaniaMCP using Podman instead of Docker.

## 🐳 Podman vs Docker

Podman is a daemonless, open-source container engine that is fully compatible with Docker. Key advantages:

- **Daemonless architecture** - No background service required
- **Rootless containers** - Better security by default
- **Docker-compatible CLI** - Uses the same commands as Docker
- **Systemd integration** - Better integration with Linux systems

## 📋 Prerequisites

### Install Podman

```bash
# On Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y podman podman-compose

# On CentOS/RHEL
sudo yum install -y podman podman-compose

# On Fedora
sudo dnf install -y podman podman-compose

# On Arch Linux
sudo pacman -S podman podman-compose
```

### Verify Installation

```bash
podman --version
podman-compose --version
```

## 🚀 Quick Start with Podman

### Build the Container Image

```bash
# Build using Podman
podman build -t alsaniamcp/mcp:latest .

# Or build using the provided script
./start_mcp.sh --build --podman
```

### Run the Container

```bash
# Basic run command
podman run -d \
  -p 8050:8050 \
  -e SESSION_SECRET=your-secret-here \
  -e NODE_ENV=production \
  --name alsaniamcp \
  alsaniamcp/mcp:latest

# With volume mounts for configuration
podman run -d \
  -p 8050:8050 \
  -e SESSION_SECRET=your-secret-here \
  -e NODE_ENV=production \
  -v ./config:/app/config \
  -v ./data:/app/data \
  --name alsaniamcp \
  alsaniamcp/mcp:latest
```

### Using Podman Compose

```bash
# Start the services
podman-compose up -d

# Or with newer Podman versions
podman compose up -d

# Stop the services
podman-compose down

# View logs
podman-compose logs -f
```

## 📁 Available Compose Files

### 1. `compose.yml` - Cross-compatible

This file works with both Docker Compose and Podman Compose:

```bash
# Start with Docker
docker-compose -f compose.yml up -d

# Start with Podman
podman-compose -f compose.yml up -d
```

### 2. `podman-compose.yml` - Podman Optimized

This file includes Podman-specific optimizations:

```bash
# Start with Podman-specific optimizations
podman-compose -f podman-compose.yml up -d
```

## 🔧 Podman-Specific Features

### Rootless Containers

```bash
# Run as non-root user (recommended)
podman run --userns=keep-id -d \
  -p 8050:8050 \
  --name alsaniamcp \
  alsaniamcp/mcp:latest
```

### Enhanced Security

```bash
# Run with enhanced security options
podman run -d \
  --security-opt no-new-privileges \
  --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  --cap-add=CHOWN \
  --cap-add=SETGID \
  --cap-add=SETUID \
  -p 8050:8050 \
  --name alsaniamcp \
  alsaniamcp/mcp:latest
```

### Resource Limits

```bash
# Run with resource constraints
podman run -d \
  --memory=1G \
  --memory-swap=1.5G \
  --cpus=2 \
  -p 8050:8050 \
  --name alsaniamcp \
  alsaniamcp/mcp:latest
```

## 🛠️ Management Commands

### Container Management

```bash
# List running containers
podman ps

# View container logs
podman logs alsaniamcp -f

# Stop a container
podman stop alsaniamcp

# Remove a container
podman rm alsaniamcp

# View container statistics
podman stats alsaniamcp
```

### Image Management

```bash
# List images
podman images

# Remove an image
podman rmi alsaniamcp/mcp:latest

# Pull an image
podman pull alsaniamcp/mcp:latest
```

### Network Management

```bash
# List networks
podman network ls

# Create a custom network
podman network create alsaniamcp-net

# Inspect a network
podman network inspect alsaniamcp-net
```

### Volume Management

```bash
# List volumes
podman volume ls

# Create a volume
podman volume create alsaniamcp-data

# Inspect a volume
podman volume inspect alsaniamcp-data
```

## 🔄 Migration from Docker to Podman

### Simple Migration Steps

1. **Install Podman** (as shown above)
2. **Replace `docker` with `podman`** in your commands
3. **Replace `docker-compose` with `podman-compose`**

### Handling Docker Compose Files

```bash
# Convert Docker Compose to Podman Compose
# Most files work directly, but you can optimize them

# Example: Update volume definitions for better Podman integration
sed -i 's/\.\/data:/\.\/data:Z/' docker-compose.yml
```

## 📊 Performance Optimization

### Podman Systemd Services

```bash
# Generate systemd service file
podman generate systemd --name alsaniamcp --files

# Move to systemd directory
sudo mv container-alsaniamcp.service /etc/systemd/system/

# Enable and start the service
sudo systemctl enable container-alsaniamcp.service
sudo systemctl start container-alsaniamcp.service
```

### Podman Auto-update

```bash
# Enable auto-updates for your container
podman auto-update --help

# Configure auto-update in your systemd service
# Add: X-Podman-auto-update=true
```

## 🐛 Troubleshooting

### Common Issues

**Issue: Permission denied when running Podman**

```bash
# Solution: Add user to the podman group or use rootless mode
sudo usermod -aG podman $USER
newgrp podman
```

**Issue: Port already in use**

```bash
# Solution: Find and stop the conflicting container
podman ps --filter publish=8050
podman stop <container-id>
```

**Issue: Volume permission issues**

```bash
# Solution: Use the :Z or :z SELinux labels
podman run -v ./data:/app/data:Z ...
```

**Issue: podman-compose not found**

```bash
# Solution: Install podman-compose separately
pip install podman-compose
```

## 📋 Best Practices

### Security Best Practices

1. **Always run as non-root user**
2. **Use `--userns=keep-id` for better security**
3. **Drop unnecessary capabilities with `--cap-drop`**
4. **Use SELinux labels (`:Z` or `:z`) for volumes**
5. **Regularly update your container images**

### Performance Best Practices

1. **Use Podman's systemd integration for production**
2. **Set appropriate resource limits**
3. **Use `--tmpfs` for temporary files when possible**
4. **Consider Podman's auto-update feature**
5. **Monitor container performance with `podman stats`**

## 🔗 Useful Resources

- [Podman Official Documentation](https://podman.io/docs)
- [Podman Compose Documentation](https://github.com/containers/podman-compose)
- [Podman vs Docker Comparison](https://podman.io/getting-started/differences)
- [Podman Security Guide](https://podman.io/security)

## 📝 Notes

- Podman is fully compatible with Dockerfiles and Docker Compose files
- The same container images work with both Podman and Docker
- Podman provides better security by default with rootless containers
- Podman integrates better with systemd and Linux systems