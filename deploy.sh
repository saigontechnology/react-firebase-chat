#!/bin/bash

# Production deployment script for React Firebase Chat
# Phase 8: Deployment & Monitoring as per Implementation Roadmap

set -e  # Exit on any error

echo "🚀 React Firebase Chat - Production Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Environment checks
print_status "Checking environment..."

# Check if npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check package name
PACKAGE_NAME=$(node -p "require('./package.json').name")
if [ "$PACKAGE_NAME" != "react-firebase-chat" ]; then
    print_error "Wrong package. Expected 'react-firebase-chat', got '$PACKAGE_NAME'"
    exit 1
fi

print_success "Environment checks passed"

# Step 2: Pre-deployment validation
print_status "Running pre-deployment validation..."

# Clean install dependencies
print_status "Installing dependencies..."
npm ci --silent

# Run linting
print_status "Running ESLint..."
if npm run lint --silent; then
    print_success "Linting passed"
else
    print_warning "Linting issues found, but continuing..."
fi

# Run tests
print_status "Running tests..."
if npm test -- --passWithNoTests --silent; then
    print_success "Tests passed"
else
    print_error "Tests failed. Deployment aborted."
    exit 1
fi

# Step 3: Build for production
print_status "Building for production..."

# Clean previous build
if [ -d "dist" ]; then
    rm -rf dist
    print_status "Cleaned previous build"
fi

# Build the library
if npm run build --silent; then
    print_success "Build completed successfully"
else
    print_error "Build failed. Deployment aborted."
    exit 1
fi

# Verify build output
if [ ! -d "dist" ] || [ ! -f "dist/index.js" ]; then
    print_error "Build output not found. Build may have failed."
    exit 1
fi

# Step 4: Package validation
print_status "Validating package..."

# Check package size
PACKAGE_SIZE=$(du -sh dist | cut -f1)
print_status "Package size: $PACKAGE_SIZE"

# Validate package.json fields
VERSION=$(node -p "require('./package.json').version")
DESCRIPTION=$(node -p "require('./package.json').description")
MAIN=$(node -p "require('./package.json').main")

print_status "Package version: $VERSION"
print_status "Description: $DESCRIPTION"
print_status "Main entry: $MAIN"

# Check if main file exists
if [ ! -f "$MAIN" ]; then
    print_error "Main entry file '$MAIN' not found"
    exit 1
fi

# Step 5: Security audit
print_status "Running security audit..."
if npm audit --audit-level moderate --silent; then
    print_success "Security audit passed"
else
    print_warning "Security vulnerabilities found. Review before publishing."
fi

# Step 6: Generate bundle analysis
print_status "Analyzing bundle..."

# Create bundle size report
BUNDLE_SIZE=$(stat -f%z dist/index.js 2>/dev/null || stat -c%s dist/index.js 2>/dev/null || echo "unknown")
GZIP_SIZE=$(gzip -c dist/index.js | wc -c | tr -d ' ')

echo "📊 Bundle Analysis:" > build-report.txt
echo "==================" >> build-report.txt
echo "Bundle size: ${BUNDLE_SIZE} bytes" >> build-report.txt
echo "Gzipped size: ${GZIP_SIZE} bytes" >> build-report.txt
echo "Build date: $(date)" >> build-report.txt
echo "Git commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')" >> build-report.txt

print_success "Bundle analysis complete - see build-report.txt"

# Step 7: Documentation generation
print_status "Generating documentation..."

# Create API documentation (if typedoc is available)
if command -v typedoc &> /dev/null; then
    npx typedoc src/index.ts --out docs/api --silent
    print_success "API documentation generated"
else
    print_warning "typedoc not found, skipping API docs generation"
fi

# Step 8: Pre-publish verification
print_status "Pre-publish verification..."

# Test package installation locally
print_status "Testing local package installation..."
npm pack --silent
TARBALL="react-firebase-chat-${VERSION}.tgz"

if [ -f "$TARBALL" ]; then
    print_success "Package tarball created: $TARBALL"
    
    # Create test directory and verify installation
    TEST_DIR="./test-install-$$"
    mkdir "$TEST_DIR"
    cd "$TEST_DIR"
    
    # Initialize test package
    echo '{"name":"test-install","version":"1.0.0"}' > package.json
    
    # Install the package
    if npm install "../$TARBALL" --silent; then
        print_success "Local package installation test passed"
    else
        print_error "Local package installation failed"
        cd ..
        rm -rf "$TEST_DIR"
        rm "$TARBALL"
        exit 1
    fi
    
    # Test basic import
    echo "const chat = require('react-firebase-chat'); console.log('Import test passed');" > test.js
    if node test.js; then
        print_success "Import test passed"
    else
        print_error "Import test failed"
        cd ..
        rm -rf "$TEST_DIR"
        rm "$TARBALL"
        exit 1
    fi
    
    # Cleanup test
    cd ..
    rm -rf "$TEST_DIR"
    rm "$TARBALL"
else
    print_error "Failed to create package tarball"
    exit 1
fi

# Step 9: Cross-platform compatibility check
print_status "Checking cross-platform compatibility..."

# Verify Firebase Web SDK compatibility
if node -e "require('firebase/app'); console.log('Firebase Web SDK compatible');" 2>/dev/null; then
    print_success "Firebase Web SDK compatibility verified"
else
    print_error "Firebase Web SDK compatibility issue"
    exit 1
fi

# Step 10: Final deployment summary
print_success "🎉 All deployment checks passed!"
echo ""
echo "📋 Deployment Summary:"
echo "====================="
echo "Package: $PACKAGE_NAME@$VERSION"
echo "Build size: $PACKAGE_SIZE"
echo "Gzipped: $GZIP_SIZE bytes"
echo "Ready for: NPM publishing, CDN distribution"
echo ""

# Step 11: Deployment options
echo "🚀 Ready to deploy! Choose an option:"
echo "1. Publish to NPM (npm publish)"
echo "2. Publish as pre-release (npm publish --tag beta)"
echo "3. Generate release artifacts only"
echo "4. Exit without publishing"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        print_status "Publishing to NPM..."
        if npm publish; then
            print_success "✅ Successfully published to NPM!"
            print_status "View at: https://npmjs.com/package/$PACKAGE_NAME"
        else
            print_error "❌ NPM publish failed"
            exit 1
        fi
        ;;
    2)
        print_status "Publishing as pre-release..."
        if npm publish --tag beta; then
            print_success "✅ Successfully published as pre-release!"
            print_status "Install with: npm install $PACKAGE_NAME@beta"
        else
            print_error "❌ Pre-release publish failed"
            exit 1
        fi
        ;;
    3)
        print_status "Generating release artifacts..."
        npm pack
        print_success "✅ Release artifacts generated"
        ;;
    4)
        print_status "Deployment preparation complete. Exiting..."
        ;;
    *)
        print_error "Invalid choice. Exiting..."
        exit 1
        ;;
esac

# Step 12: Post-deployment monitoring setup
if [ "$choice" = "1" ] || [ "$choice" = "2" ]; then
    print_status "Setting up post-deployment monitoring..."
    
    # Create monitoring script
    cat > monitor-deployment.sh << 'EOF'
#!/bin/bash
# Post-deployment monitoring script

PACKAGE_NAME="react-firebase-chat"

echo "📊 Monitoring deployment of $PACKAGE_NAME..."

# Check NPM registry
echo "Checking NPM registry..."
npm view $PACKAGE_NAME version

# Check download stats
echo "Download stats (if available):"
npm view $PACKAGE_NAME --json | grep -E "(weekly|monthly)" || echo "Stats not available yet"

# Check for issues
echo "Recent issues (check manually): https://github.com/your-repo/issues"

echo "✅ Monitoring complete"
EOF

    chmod +x monitor-deployment.sh
    print_success "✅ Monitoring script created: monitor-deployment.sh"
fi

print_success "🎉 Deployment process complete!"
echo ""
echo "📚 Next steps:"
echo "- Monitor NPM downloads and feedback"
echo "- Update documentation if needed"
echo "- Prepare CDN distribution if required"
echo "- Test integration with React Native apps"
echo ""
echo "🔗 Useful links:"
echo "- NPM package: https://npmjs.com/package/$PACKAGE_NAME"
echo "- Documentation: ./README.md"
echo "- Examples: ./examples/"
echo ""

exit 0
