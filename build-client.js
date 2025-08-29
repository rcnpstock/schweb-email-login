const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building client for production...');

try {
    // Build the client
    process.chdir('./client');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Copy build files to server directory for serving
    const buildDir = './dist';
    const serverStaticDir = '../server/public';
    
    // Create server public directory if it doesn't exist
    if (!fs.existsSync(serverStaticDir)) {
        fs.mkdirSync(serverStaticDir, { recursive: true });
    }
    
    // Copy build files
    execSync(`cp -r ${buildDir}/* ${serverStaticDir}/`, { stdio: 'inherit' });
    
    console.log('✅ Client build completed and copied to server!');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}