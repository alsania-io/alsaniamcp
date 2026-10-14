#!/bin/bash
# Create release archive for Alsania Gateway

set -e

VERSION=${1:-"latest"}
OUTPUT_DIR=${2:-"releases"}

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Clean and prepare
make clean
make install
make prepare-env
make build

# Create archive name with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE_NAME="alsania-gateway-${VERSION}-${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="$OUTPUT_DIR/$ARCHIVE_NAME"

echo "Creating release archive: $ARCHIVE_PATH"

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy files to temp directory
cp -r . "$TEMP_DIR/alsania-gateway/"
cd "$TEMP_DIR"

# Remove unnecessary files
cd alsania-gateway
rm -rf .git/
rm -rf node_modules/
rm -rf __pycache__/
rm -rf .pytest_cache/
rm -rf htmlcov/
rm -rf .coverage
rm -rf *.pyc
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true

# Create archive
tar -czf "../$ARCHIVE_NAME" .

# Move to output directory
mv "../$ARCHIVE_NAME" "$OUTPUT_DIR/"

echo "Release archive created: $OUTPUT_DIR/$ARCHIVE_NAME"
echo "Size: $(du -h "$OUTPUT_DIR/$ARCHIVE_NAME" | cut -f1)"

# Calculate checksum
sha256sum "$OUTPUT_DIR/$ARCHIVE_NAME" > "$OUTPUT_DIR/$ARCHIVE_NAME.sha256"

echo "SHA256 checksum: $OUTPUT_DIR/$ARCHIVE_NAME.sha256"
echo ""
echo "To extract: tar -xzf $ARCHIVE_NAME"
echo "To verify: sha256sum -c $ARCHIVE_NAME.sha256"