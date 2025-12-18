import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IMAGE_DIRS = [
  path.join(__dirname, '../src/resources/images'),
  path.join(__dirname, '../src/resources/AiImages'),
  path.join(__dirname, '../src/resources/Icon'),
  path.join(__dirname, '../public'),
];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

async function convertToWebP(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) return;

    const webpPath = filePath.replace(/\.(png|jpg|jpeg)$/i, '.webp');
    
    // Check if WebP already exists
    try {
      await fs.access(webpPath);
      console.log(`⏩ Skipping (already exists): ${path.basename(webpPath)}`);
      return;
    } catch {
      // WebP doesn't exist, proceed with conversion
    }

    const stats = await fs.stat(filePath);
    const originalSize = stats.size;

    await sharp(filePath)
      .webp({ quality: 85 })
      .toFile(webpPath);

    const webpStats = await fs.stat(webpPath);
    const webpSize = webpStats.size;
    const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1);

    console.log(
      `✅ Converted: ${path.basename(filePath)} → ${path.basename(webpPath)} (${reduction}% smaller)`
    );
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

async function processDirectory(dir) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        await processDirectory(filePath);
      } else {
        await convertToWebP(filePath);
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');

  for (const dir of IMAGE_DIRS) {
    console.log(`📁 Processing: ${dir}`);
    await processDirectory(dir);
    console.log('');
  }

  console.log('✨ Image optimization complete!');
  console.log('\n💡 Tips:');
  console.log('- Use <OptimizedImage> component instead of <img> for automatic WebP support');
  console.log('- Original files are kept as fallbacks for older browsers');
  console.log('- Run "npm run build" to apply additional optimizations');
}

main();
