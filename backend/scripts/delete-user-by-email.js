const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const User = require('../src/models/User');
const EmailVerification = require('../src/models/EmailVerification');
const PasswordReset = require('../src/models/PasswordReset');
const AdminRequest = require('../src/models/AdminRequest');

const usage = () => {
  console.log('Usage: node scripts/delete-user-by-email.js <email> [--yes] [--env-file <file>]');
  console.log('Examples:');
  console.log('  node scripts/delete-user-by-email.js trungha9389@mail.com');
  console.log('  node scripts/delete-user-by-email.js trungha9389@mail.com --yes');
  console.log('  node scripts/delete-user-by-email.js trungha9389@mail.com --env-file .env.production');
  console.log('  node scripts/delete-user-by-email.js trungha9389@mail.com --env-file .env.production --yes');
};

const parseArgs = () => {
  const [, , emailArg, ...rest] = process.argv;
  const yes = rest.includes('--yes') || rest.includes('-y');

  let envFile = null;
  const envFileIdx = rest.findIndex((x) => x === '--env-file');
  if (envFileIdx >= 0 && rest[envFileIdx + 1]) {
    envFile = rest[envFileIdx + 1];
  }

  return { emailArg, yes, envFile };
};

const main = async () => {
  const { emailArg, yes, envFile } = parseArgs();

  if (!emailArg) {
    usage();
    process.exit(1);
  }

  const email = String(emailArg).toLowerCase().trim();

  const escapeRegExp = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const emailRegex = new RegExp(`^\\s*${escapeRegExp(email)}\\s*$`, 'i');

  // Load env file (default: backend/.env). Allow selecting a different env file.
  const defaultEnvPath = path.resolve(__dirname, '..', '.env');
  const envPath = envFile ? path.resolve(__dirname, '..', envFile) : defaultEnvPath;
  const envExists = fs.existsSync(envPath);
  const dotenvResult = dotenv.config({ path: envPath });

  console.log('🧩 Environment:');
  console.log('  - env file:', envFile || '.env');
  console.log('  - env path:', envPath);
  console.log('  - exists:', envExists);
  if (dotenvResult.error) {
    console.log('  - dotenv error:', dotenvResult.error.message);
  } else {
    console.log('  - dotenv loaded:', Boolean(dotenvResult.parsed));
  }
  console.log('');

  if (!process.env.MONGODB_URI) {
    console.error('❌ Missing MONGODB_URI in environment file:', envFile || '.env');
    process.exit(1);
  }

  const maskSecret = (value) => {
    if (!value) return value;
    const str = String(value);
    if (str.length <= 8) return '***';
    return `${str.slice(0, 4)}***${str.slice(-4)}`;
  };

  const safeDoc = (doc) => {
    if (!doc) return doc;
    const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    const out = { ...obj };
    if (out.token) out.token = maskSecret(out.token);
    if (out.otp) out.otp = maskSecret(out.otp);
    if (out.password) out.password = '***';
    return out;
  };

  try {
    console.log('🔌 Connecting to MongoDB...');
    const maskedUri = String(process.env.MONGODB_URI).replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
    console.log('🔗 URI:', maskedUri);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('🏷️  Database:', mongoose.connection.name);

    const users = await User.find({ email: { $regex: emailRegex } })
      .select('_id email emailVerified createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const emailVerifications = await EmailVerification.find({ email: { $regex: emailRegex } })
      .select('_id email user createdAt verified verifiedAt token otp')
      .sort({ createdAt: -1 })
      .limit(10);

    const passwordResets = await PasswordReset.find({ email: { $regex: emailRegex } })
      .select('_id email userId createdAt used usedAt token otp')
      .sort({ createdAt: -1 })
      .limit(10);

    const adminRequests = await AdminRequest.find({ email: { $regex: emailRegex } })
      .select('_id email user status isValidated validationToken validationTokenExpires createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(10);

    const counts = {
      users: users.length,
      emailVerifications: emailVerifications.length,
      passwordResets: passwordResets.length,
      adminRequests: adminRequests.length
    };

    console.log('\n🔎 Found:');
    console.log(`  - User: ${counts.users}`);
    console.log(`  - EmailVerification: ${counts.emailVerifications}`);
    console.log(`  - PasswordReset: ${counts.passwordResets}`);
    console.log(`  - AdminRequest: ${counts.adminRequests}`);

    console.log('\n📄 Details (sanitized):');
    console.log('  - User:', users.map(safeDoc));
    console.log('  - EmailVerification:', emailVerifications.map(safeDoc));
    console.log('  - PasswordReset:', passwordResets.map(safeDoc));
    console.log('  - AdminRequest:', adminRequests.map((r) => {
      const o = safeDoc(r);
      if (o.validationToken) o.validationToken = maskSecret(o.validationToken);
      return o;
    }));

    if (!yes) {
      console.log('\n⚠️  Dry run only. Re-run with --yes to delete.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log('\n🗑️  Deleting...');

    const deleted = {
      emailVerifications: (await EmailVerification.deleteMany({ email: { $regex: emailRegex } })).deletedCount,
      passwordResets: (await PasswordReset.deleteMany({ email: { $regex: emailRegex } })).deletedCount,
      adminRequests: (await AdminRequest.deleteMany({ email: { $regex: emailRegex } })).deletedCount,
      users: (await User.deleteMany({ email: { $regex: emailRegex } })).deletedCount
    };

    console.log('\n✅ Deleted:');
    console.log(`  - User: ${deleted.users}`);
    console.log(`  - EmailVerification: ${deleted.emailVerifications}`);
    console.log(`  - PasswordReset: ${deleted.passwordResets}`);
    console.log(`  - AdminRequest: ${deleted.adminRequests}`);

    console.log('\n✨ Done. You can register again with this email.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed:', error);
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
    process.exit(1);
  }
};

main();
