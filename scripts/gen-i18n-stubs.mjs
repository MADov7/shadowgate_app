import { writeFileSync, existsSync } from 'node:fs';
const all = ['common','nav','welcome','hero','radar','layers','simulation','quiz','constellation','catalog','details','basket','packages','build','personal','booking','contact','brand','footer'];
const base = new URL('../src/i18n/locales/', import.meta.url);
for (const ns of all) {
  const cap = ns[0].toUpperCase() + ns.slice(1);
  const en = new URL(`en/${ns}.ts`, base), ar = new URL(`ar/${ns}.ts`, base);
  if (!existsSync(en)) writeFileSync(en, `// OWNER: builder agent for the '${ns}' area. Replace these placeholder keys freely; keep ar/${ns}.ts in sync.\nexport const ${ns}En = {\n  title: '${cap}',\n} as const;\n`);
  if (!existsSync(ar)) writeFileSync(ar, `import type { ${ns}En } from '../en/${ns}';\n\nexport const ${ns}Ar: Record<keyof typeof ${ns}En, string> = {\n  title: '${cap}',\n};\n`);
}
for (const [dir, suf] of [['en','En'],['ar','Ar']]) {
  const lines = ['// Namespace registry — builder agents only edit their own namespace files, not this one.'];
  for (const ns of all) lines.push(`import { ${ns}${suf} } from './${ns}';`);
  lines.push('', `export const ${dir} = {`);
  for (const ns of all) lines.push(`  ${ns}: ${ns}${suf},`);
  lines.push('};', '');
  writeFileSync(new URL(`${dir}/index.ts`, base), lines.join('\n'));
}
console.log('i18n stubs ok');
