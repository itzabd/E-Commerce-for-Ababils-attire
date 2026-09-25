import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const outDir = path.resolve('docs/client-handover/screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const targets = [
  { name: 'mobile_home.png', url: 'http://localhost:5173/', width: 390, height: 844 },
  { name: 'mobile_dresses.png', url: 'http://localhost:5173/dresses', width: 390, height: 844 },
  { name: 'mobile_cakes.png', url: 'http://localhost:5173/cakes', width: 390, height: 844 },
  { name: 'mobile_bag.png', url: 'http://localhost:5173/bag', width: 390, height: 844 },
  { name: 'mobile_checkout.png', url: 'http://localhost:5173/checkout', width: 390, height: 844 },
  { name: 'mobile_track.png', url: 'http://localhost:5173/track-order', width: 390, height: 844 },
  { name: 'mobile_admin_login.png', url: 'http://localhost:5173/admin/login', width: 390, height: 844 },
  { name: 'mobile_contact.png', url: 'http://localhost:5173/contact', width: 390, height: 844 }
];

console.log('Capturing mobile POV screenshots...');

for (const t of targets) {
  const dest = path.join(outDir, t.name);
  const cmd = `"${edge}" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=3000 --run-all-compositor-stages-before-draw --window-size=${t.width},${t.height} --screenshot="${dest}" "${t.url}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
    const stat = fs.statSync(dest);
    console.log(`Captured: ${t.name} (${t.width}x${t.height}) - ${stat.size} bytes`);
  } catch (err) {
    console.error(`Failed ${t.name}:`, err.message);
  }
}

console.log('All mobile screenshots captured successfully.');
