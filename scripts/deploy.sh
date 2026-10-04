#!/bin/bash

# Production deployment script
set -e

echo "🚀 Starting production deployment..."

# 1. Backup current database
echo "📦 Creating backup..."
tsx scripts/backup.ts

# 2. Generate migrations
echo "📝 Generating migrations..."
drizzle-kit generate

# 3. Run migrations
echo "🔄 Running migrations..."
tsx scripts/migrate.ts

# 4. Seed database
echo "🌱 Seeding database..."
tsx scripts/seed.ts

# 5. Build application
echo "🔨 Building application..."
npm run build

echo "✅ Deployment completed successfully!"
echo "🎉 Application is ready for production"