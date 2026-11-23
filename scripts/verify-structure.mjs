import { readFileSync,existsSync } from 'node:fs';
const required=[
 'AGENTS.md','README.md','docs/MASTER-PRODUCT-BRIEF.txt','docs/ANTIGRAVITY-BUILD-PLAN.md',
 'package.json','.env.example','src/app/page.tsx','src/app/app/page.tsx','src/app/app/properties/page.tsx',
 'src/app/app/maintenance/page.tsx','src/app/app/inspections/page.tsx','src/app/app/finances/page.tsx',
 'src/app/app/documents/page.tsx','src/app/app/admin/page.tsx',
 'src/actions/data.ts','src/actions/auth.ts','src/lib/supabase/server.ts',
 'supabase/migrations/001_initial.sql','supabase/migrations/002_workflows_and_hardening.sql',
 'supabase/migrations/003_inspection_evidence.sql','legacy-prototype/index.html'
];
let errors=[];for(const x of required)if(!existsSync(x))errors.push(`Missing ${x}`);
const migrations=['001_initial.sql','002_workflows_and_hardening.sql','003_inspection_evidence.sql'];
for(const f of migrations){const src=readFileSync('supabase/migrations/'+f,'utf8');if(!src.includes('security definer'))errors.push('Missing RPC hardening: '+f);}
const env=readFileSync('.env.example','utf8');if(/(?:service_role|sk_test_|sk_live_)\s*=\s*\S+/i.test(env))errors.push('Potential private key in .env.example');
console.log(`DARIYA structure: ${required.length-errors.length}/${required.length} required files verified`);
console.log(errors.length?'FAIL:\n'+errors.join('\n'):'PASS: required files and migration checks');
process.exitCode=errors.length?1:0;
