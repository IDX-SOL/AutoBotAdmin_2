#!/bin/bash

echo "🚀 Setting up Email Monitoring for Admin Panel..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Email Monitoring setup complete!"
echo ""
echo "Next steps:"
echo "1. Start the admin panel: npm run dev"
echo "2. Navigate to /admin/email-monitoring"
echo "3. Start the backend server to enable API endpoints"
echo ""
echo "Features available:"
echo "✅ Email logs with filtering and search"
echo "✅ Email content preview"
echo "✅ Email status tracking"
echo "✅ Resend failed emails"
echo "✅ Analytics and statistics"
echo "✅ Real-time monitoring"
