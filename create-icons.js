const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#059669'); // Primary green
    gradient.addColorStop(1, '#047857'); // Darker green
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Tree icon (simplified)
    const centerX = size / 2;
    const centerY = size / 2;
    const scale = size / 192; // Base scale for 192px
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3 * scale;
    
    // Tree trunk
    const trunkWidth = 20 * scale;
    const trunkHeight = 40 * scale;
    ctx.fillRect(centerX - trunkWidth/2, centerY + 20 * scale, trunkWidth, trunkHeight);
    
    // Tree leaves (three circles)
    const leafRadius = 25 * scale;
    ctx.beginPath();
    // Top circle
    ctx.arc(centerX, centerY - 25 * scale, leafRadius, 0, 2 * Math.PI);
    // Left circle
    ctx.arc(centerX - 22 * scale, centerY, leafRadius * 0.8, 0, 2 * Math.PI);
    // Right circle
    ctx.arc(centerX + 22 * scale, centerY, leafRadius * 0.8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add "TUC" text
    ctx.fillStyle = '#059669';
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TUC', centerX, centerY + 5 * scale);
    
    // Add checkmark symbol
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(centerX - 15 * scale, centerY - 50 * scale);
    ctx.lineTo(centerX - 5 * scale, centerY - 35 * scale);
    ctx.lineTo(centerX + 15 * scale, centerY - 55 * scale);
    ctx.stroke();
    
    // Save the icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`public/${filename}`, buffer);
    console.log(`✅ Created ${filename} (${size}x${size})`);
}

// Create directory if it doesn't exist
if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

// Generate all required icons
const sizes = [
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 16, name: 'favicon-16x16.png' }
];

console.log('🎨 Generating PWA icons...\n');

try {
    sizes.forEach(({ size, name }) => {
        createIcon(size, name);
    });
    console.log('\n🎉 All icons generated successfully!');
    console.log('📱 Your PWA is now ready for installation on mobile devices.');
} catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('💡 Install canvas: npm install canvas');
}