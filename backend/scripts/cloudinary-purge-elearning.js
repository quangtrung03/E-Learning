const dotenv = require('dotenv');

dotenv.config();

const { cloudinary } = require('../src/config/cloudinary');

const hasFlag = (name) => process.argv.includes(name);

const getArg = (name, fallback = null) => {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  return process.argv[idx + 1] ?? true;
};

const assertConfigured = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error('❌ Missing Cloudinary env vars:', missing.join(', '));
    process.exit(1);
  }
};

const listAllPublicIds = async ({ prefix, resourceType }) => {
  const all = [];
  let nextCursor = null;
  do {
    const resp = await cloudinary.api.resources({
      type: 'upload',
      prefix,
      resource_type: resourceType,
      max_results: 500,
      next_cursor: nextCursor || undefined
    });

    const ids = (resp.resources || []).map((r) => r.public_id).filter(Boolean);
    all.push(...ids);
    nextCursor = resp.next_cursor || null;
  } while (nextCursor);

  return all;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const deletePublicIds = async ({ publicIds, resourceType }) => {
  if (!publicIds.length) return { deleted: 0 };

  const batches = chunk(publicIds, 100);
  let deleted = 0;
  for (const batch of batches) {
    const resp = await cloudinary.api.delete_resources(batch, {
      type: 'upload',
      resource_type: resourceType
    });
    const deletedCount = Object.values(resp.deleted || {}).filter((v) => v === 'deleted').length;
    deleted += deletedCount;
    console.log(`  ✅ Deleted ${deletedCount}/${batch.length} (${resourceType})`);
  }
  return { deleted };
};

async function main() {
  assertConfigured();

  const prefix = String(getArg('--prefix', process.env.CLOUDINARY_PURGE_PREFIX || 'elearning/') || '').trim();
  const force = hasFlag('--confirm') || hasFlag('--force') || process.env.CLOUDINARY_PURGE_CONFIRM === 'YES';
  const allowProduction = hasFlag('--allow-production') || process.env.CLOUDINARY_PURGE_ALLOW_PROD === 'YES';

  if (!prefix) {
    console.error('❌ Missing --prefix');
    process.exit(1);
  }

  // Safety: default to only deleting within elearning/
  if (!prefix.startsWith('elearning/')) {
    console.error('❌ Refusing to purge prefix outside elearning/');
    console.error('   Use --prefix elearning/... (recommended)');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !allowProduction) {
    console.error('❌ NODE_ENV=production detected. Refusing to purge.');
    console.error('   Re-run with --allow-production or set CLOUDINARY_PURGE_ALLOW_PROD=YES');
    process.exit(1);
  }

  if (!force) {
    console.error('⚠️ This will DELETE Cloudinary resources under prefix:', prefix);
    console.error('   For safety, pass --confirm (recommended) or set CLOUDINARY_PURGE_CONFIRM=YES');
    process.exit(1);
  }

  console.log('🧨 Purging Cloudinary by prefix');
  console.log('   cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
  console.log('   prefix    :', prefix);
  console.log('');

  const resourceTypes = ['image', 'video', 'raw'];
  let totalDeleted = 0;

  for (const resourceType of resourceTypes) {
    console.log(`🔎 Listing ${resourceType} resources...`);
    const publicIds = await listAllPublicIds({ prefix, resourceType });
    console.log(`  Found: ${publicIds.length}`);

    if (!publicIds.length) continue;
    console.log(`🗑️  Deleting ${resourceType}...`);
    const { deleted } = await deletePublicIds({ publicIds, resourceType });
    totalDeleted += deleted;
  }

  // Best-effort: delete top-level folder, ignore errors
  try {
    const folder = prefix.replace(/\/+$/, '');
    await cloudinary.api.delete_folder(folder);
  } catch (e) {
    // ignore
  }

  console.log('');
  console.log(`✨ Done. Total deleted: ${totalDeleted}`);
}

main().catch((err) => {
  console.error('❌ Purge failed:', err);
  process.exit(1);
});
