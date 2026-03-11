const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const usage = () => {
  console.log('Usage: node scripts/audit-db.js [--env-file <file>] [--collection <name>] [--sample <n>] [--search <text>]');
  console.log('Examples:');
  console.log('  node scripts/audit-db.js');
  console.log('  node scripts/audit-db.js --sample 1');
  console.log('  node scripts/audit-db.js --search trungha9389@mail.com');
  console.log('  node scripts/audit-db.js --collection users --sample 2');
  console.log('  node scripts/audit-db.js --env-file .env.production --search trungha9389@mail.com --sample 1');
};

const parseArgs = () => {
  const args = process.argv.slice(2);

  const getValue = (key) => {
    const idx = args.findIndex((x) => x === key);
    if (idx >= 0 && args[idx + 1]) return args[idx + 1];
    return null;
  };

  const envFile = getValue('--env-file');
  const collection = getValue('--collection');
  const sampleRaw = getValue('--sample');
  const search = getValue('--search');

  const sample = sampleRaw ? Math.max(0, Number(sampleRaw) || 0) : 0;

  return { envFile, collection, sample, search };
};

const maskSecret = (value) => {
  if (value === null || value === undefined) return value;
  const str = String(value);
  if (str.length <= 8) return '***';
  return `${str.slice(0, 4)}***${str.slice(-4)}`;
};

const truncate = (value, max = 200) => {
  if (typeof value !== 'string') return value;
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…(len=${value.length})`;
};

const maskEmail = (email) => {
  const str = String(email);
  const at = str.indexOf('@');
  if (at <= 1) return '***@***';
  const local = str.slice(0, at);
  const domain = str.slice(at + 1);
  const localMasked = `${local[0]}***${local.slice(-1)}`;
  const domainParts = domain.split('.');
  const domainHead = domainParts[0] ? `${domainParts[0].slice(0, 2)}***` : '***';
  const domainTail = domainParts.length > 1 ? `.${domainParts.slice(1).join('.')}` : '';
  return `${localMasked}@${domainHead}${domainTail}`;
};

const sanitize = (input) => {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(sanitize);
  if (typeof input !== 'object') {
    if (typeof input === 'string') {
      const trimmed = input.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return maskEmail(trimmed);
      }
    }
    return truncate(input);
  }

  const out = {};
  for (const [k, v] of Object.entries(input)) {
    const key = k.toLowerCase();
    if (key.includes('password')) {
      out[k] = '***';
      continue;
    }
    if (key.includes('token') || key === 'otp' || key.includes('secret') || key.includes('apikey') || key.includes('api_key')) {
      out[k] = maskSecret(v);
      continue;
    }
    out[k] = sanitize(v);
  }
  return out;
};

const main = async () => {
  const { envFile, collection, sample, search } = parseArgs();

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    usage();
    process.exit(0);
  }

  const defaultEnvPath = path.resolve(__dirname, '..', '.env');
  const envPath = envFile ? path.resolve(__dirname, '..', envFile) : defaultEnvPath;
  const envExists = fs.existsSync(envPath);
  const dotenvResult = dotenv.config({ path: envPath });

  console.log('🧩 Environment:');
  console.log('  - env file:', envFile || '.env');
  console.log('  - env path:', envPath);
  console.log('  - exists:', envExists);
  console.log('  - dotenv loaded:', Boolean(dotenvResult.parsed));
  if (dotenvResult.error) console.log('  - dotenv error:', dotenvResult.error.message);
  console.log('');

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || String(mongoUri).trim().length === 0) {
    console.error('❌ Missing MONGODB_URI in env');
    process.exit(1);
  }

  try {
    console.log('🔌 Connecting to MongoDB...');
    const maskedUri = String(mongoUri).replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('🔗 URI:', maskedUri);

    await mongoose.connect(mongoUri);
    console.log('✅ Connected');
    console.log('🏷️  Database:', mongoose.connection.name);

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    console.log('\n📚 Collections:');
    const rows = [];
    for (const c of collections) {
      const name = c.name;
      if (!name || name.startsWith('system.')) continue;
      if (collection && name !== collection) continue;
      const count = await db.collection(name).estimatedDocumentCount();
      rows.push({ name, count });
    }
    rows.sort((a, b) => b.count - a.count);
    for (const r of rows) {
      console.log(`  - ${r.name}: ${r.count}`);
    }

    if (search && String(search).trim().length > 0) {
      const term = String(search).trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      console.log(`\n🔎 Search term: ${term}`);

      // We'll search only common email-like fields to avoid heavy full-document scanning.
      const emailFields = [
        'email',
        'userEmail',
        'to',
        'from',
        'recipient',
        'recipients'
      ];

      for (const r of rows) {
        const col = db.collection(r.name);

        const or = emailFields.map((f) => ({ [f]: { $regex: regex } }));
        // Also handle nested common shapes
        or.push({ 'user.email': { $regex: regex } });
        or.push({ 'data.email': { $regex: regex } });

        const matches = await col.find({ $or: or }).limit(5).toArray();
        if (matches.length > 0) {
          console.log(`\n  ✅ ${r.name}: ${matches.length} match(es) (showing up to 5)`);
          for (const doc of matches) {
            console.log('   ', JSON.stringify(sanitize(doc)));
          }
        }
      }
    }

    if (sample > 0) {
      console.log(`\n🧪 Samples: ${sample} doc(s) per collection (sanitized)`);
      for (const r of rows) {
        const col = db.collection(r.name);
        const docs = await col.find({}).limit(sample).toArray();
        if (docs.length === 0) continue;
        console.log(`\n  - ${r.name}`);
        for (const doc of docs) {
          console.log('   ', JSON.stringify(sanitize(doc)));
        }
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Audit failed:', err);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

main();
