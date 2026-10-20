const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('⚡ Building optimized assets for portfolio...');

try {
  const dir = __dirname;
  execSync('npx esbuild script.js --minify --outfile=script.min.js', { cwd: dir, stdio: 'inherit' });
  execSync('npx esbuild style.css --minify --outfile=style.min.css', { cwd: dir, stdio: 'inherit' });

  const jsRaw = fs.statSync(path.join(dir, 'script.js')).size;
  const jsMin = fs.statSync(path.join(dir, 'script.min.js')).size;
  const cssRaw = fs.statSync(path.join(dir, 'style.css')).size;
  const cssMin = fs.statSync(path.join(dir, 'style.min.css')).size;

  console.log(`\n✅ Build Complete!`);
  console.log(`   * script.js:  ${(jsRaw/1024).toFixed(1)} KB -> script.min.js: ${(jsMin/1024).toFixed(1)} KB (-${(((jsRaw-jsMin)/jsRaw)*100).toFixed(0)}%)`);
  console.log(`   * style.css:  ${(cssRaw/1024).toFixed(1)} KB -> style.min.css:  ${(cssMin/1024).toFixed(1)} KB (-${(((cssRaw-cssMin)/cssRaw)*100).toFixed(0)}%)`);
} catch (err) {
  console.error('❌ Build failed:', err.message);
  process.exit(1);
}
