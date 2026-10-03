import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const source = new URL('../node_modules/@vkontakte/vk-bridge/dist/browser.min.js', import.meta.url);
const target = new URL('../dist/vendor/vk-bridge.min.js', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('../node_modules/@vkontakte/vk-bridge/package.json', import.meta.url), 'utf8'));
await copyFile(source, target);
const hash = createHash('sha256').update(await readFile(target)).digest('hex');
await writeFile(new URL('../dist/vendor/README.md', import.meta.url), `# VK Bridge browser bundle\n\n\`vk-bridge.min.js\` is the browser build of \`@vkontakte/vk-bridge\` ${pkg.version},\npublished by VKCOM under the MIT license. It is copied from the exact lockfile package by \`npm run build\`.\n\n- Source: https://github.com/VKCOM/vk-bridge\n- Package: https://www.npmjs.com/package/@vkontakte/vk-bridge/v/${pkg.version}\n- SHA-256: \`${hash}\`\n`);
console.log(`Vendored VK Bridge ${pkg.version}, SHA256 ${hash}`);
