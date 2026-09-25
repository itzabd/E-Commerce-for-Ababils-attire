import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const docsDir = path.resolve('docs/client-handover');
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'));

// Find Edge executable
const possibleEdgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

let edgePath = possibleEdgePaths.find(p => fs.existsSync(p));

if (!edgePath) {
  console.error('Edge browser executable not found.');
  process.exit(1);
}

console.log(`Using Edge executable at: ${edgePath}`);

// Simple markdown to html parser helper
function simpleMdToHtml(md) {
  let html = md
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
    .replace(/\*\*(.* vast?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/`([^`]+)`/gim, '<code>$1</code>')
    .replace(/---/gim, '<hr/>');

  // Convert lists and paragraphs
  const lines = html.split('\n');
  let inList = false;
  let result = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        result.push('<ul>');
        inList = true;
      }
      result.push(`<li>${trimmed.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        result.push('<ol>');
        inList = true;
      }
      result.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
    } else {
      if (inList) {
        result.push(inList === 'ul' ? '</ul>' : '</ol>'); // close previous list
        inList = false;
      }
      if (trimmed.startsWith('<h') || trimmed.startsWith('<blockquote') || trimmed.startsWith('<hr') || trimmed === '') {
        result.push(line);
      } else {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  if (inList) {
    result.push('</ul>');
  }

  return result.join('\n');
}

const css = `
  body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #1e293b;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  h1 { font-size: 26px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 0; }
  h2 { font-size: 20px; color: #1e293b; margin-top: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
  h3 { font-size: 16px; color: #334155; margin-top: 18px; }
  p { margin: 10px 0; font-size: 14px; }
  ul, ol { padding-left: 24px; font-size: 14px; margin: 10px 0; }
  li { margin-bottom: 4px; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: 'Consolas', monospace; font-size: 13px; color: #0f766e; }
  blockquote { background: #f8fafc; border-left: 4px solid #3b82f6; margin: 16px 0; padding: 12px 16px; color: #475569; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
  strong { color: #0f172a; }
  @page { margin: 20mm; }
`;

for (const file of files) {
  const filePath = path.join(docsDir, file);
  const mdContent = fs.readFileSync(filePath, 'utf8');
  const htmlBody = simpleMdToHtml(mdContent);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${file}</title>
  <style>${css}</style>
</head>
<body>
  ${htmlBody}
</body>
</html>`;

  const tempHtmlPath = path.join(docsDir, file.replace('.md', '.temp.html'));
  const pdfPath = path.join(docsDir, file.replace('.md', '.pdf'));

  fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');

  try {
    const cmd = `"${edgePath}" --headless --disable-gpu --print-to-pdf="${pdfPath}" "file:///${tempHtmlPath.replace(/\\/g, '/')}"`;
    console.log(`Converting ${file} -> ${path.basename(pdfPath)}...`);
    execSync(cmd, { stdio: 'ignore' });
    console.log(`Successfully generated ${path.basename(pdfPath)}`);
  } catch (err) {
    console.error(`Failed to generate PDF for ${file}:`, err.message);
  } finally {
    if (fs.existsSync(tempHtmlPath)) {
      fs.unlinkSync(tempHtmlPath);
    }
  }
}

console.log('All PDF conversions completed!');
