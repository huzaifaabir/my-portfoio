// Role & access tests. Run with:  npm test
// Uses an in-memory user store and a fake Firebase Auth, so MongoDB and Firebase are NOT needed.
const path = require('path');
const assert = require('assert');
const http = require('http');

const ROOT = path.join(__dirname, '..');

// ---- In-memory User model (same method names the routes use) ---------------
let db = [];
let seq = 1;
const matches = (doc, filter = {}) => Object.entries(filter).every(([k, v]) => {
  if (v && typeof v === 'object' && '$in' in v) return v.$in.includes(doc[k]);
  return doc[k] === v;
});
function wrap(doc) {
  if (!doc) return null;
  const w = { ...doc };
  const plain = () => ({ ...w, save: undefined, deleteOne: undefined, toObject: undefined });
  w.save = async () => { Object.assign(db.find((d) => d._id === w._id), plain()); return w; };
  w.deleteOne = async () => { db = db.filter((d) => d._id !== w._id); };
  w.toObject = plain;
  return w;
}
const chain = (list) => ({ sort() { return this; }, select() { return this; }, lean: async () => list.map((d) => ({ ...d })) });
const FakeUser = {
  find: (f = {}) => chain(db.filter((d) => matches(d, f))),
  findOne: async (f) => wrap(db.find((d) => matches(d, f))),
  findById: async (id) => wrap(db.find((d) => d._id === id)),
  exists: async (f) => { const d = db.find((x) => matches(x, f)); return d ? { _id: d._id } : null; },
  countDocuments: async (f = {}) => db.filter((d) => matches(d, f)).length,
  create: async (data) => { const d = { _id: 'u' + seq++, status: 'active', ...data }; db.push(d); return wrap(d); },
};

// ---- Fake Firebase Auth -------------------------------------------------------
const fbUsers = new Map(); // email -> firebase user
const tokens = { 'tok-super': 'uid-super', 'tok-admin': 'uid-admin', 'tok-editor': 'uid-editor', 'tok-stranger': 'uid-stranger' };
const fakeAuth = {
  verifyIdToken: async (t) => {
    const uid = tokens[t];
    if (!uid) throw Object.assign(new Error('bad token'), { code: 'auth/argument-error' });
    const u = [...fbUsers.values()].find((x) => x.uid === uid);
    return { uid, email: u?.email };
  },
  getUserByEmail: async (email) => {
    const u = fbUsers.get(email);
    if (!u) throw Object.assign(new Error('not found'), { code: 'auth/user-not-found' });
    return u;
  },
  createUser: async ({ email, displayName }) => {
    const u = { uid: 'uid-' + email, email, displayName };
    fbUsers.set(email, u);
    return u;
  },
  generatePasswordResetLink: async (email) => `https://reset.example/${encodeURIComponent(email)}`,
};

// Replace modules in the require cache BEFORE the app is loaded
function stub(absPath, exportsObj) {
  require.cache[absPath] = { id: absPath, filename: absPath, loaded: true, exports: exportsObj };
}
stub(require.resolve(path.join(ROOT, 'models/User.js')), FakeUser);
stub(require.resolve(path.join(ROOT, 'config/firebase.js')), { getFirebaseApp: () => ({}), isFirebaseConfigured: () => true });
const authPath = require.resolve('firebase-admin/auth', { paths: [ROOT] });
stub(authPath, { getAuth: () => fakeAuth });

process.env.CLIENT_ORIGIN = 'http://localhost:5173';
const app = require('../app');
const usersRoute = require(path.join(ROOT, 'routes/users.js'));

// ---- Helpers ---------------------------------------------------------------
let base;
function call(method, url, token, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const r = http.request(base + url, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let txt = '';
      res.on('data', (c) => { txt += c; });
      res.on('end', () => {
        let body = {};
        try { body = txt ? JSON.parse(txt) : {}; } catch { /* non-JSON */ }
        resolve({ status: res.statusCode, body });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function seed() {
  db = [];
  seq = 10;
  fbUsers.clear();
  for (const [email, uid] of [['super@x.com', 'uid-super'], ['admin@x.com', 'uid-admin'], ['editor@x.com', 'uid-editor']]) {
    fbUsers.set(email, { uid, email });
  }
  db.push({ _id: 'u-super', firebaseUid: 'uid-super', email: 'super@x.com', name: 'Super', role: 'superadmin', status: 'active' });
  db.push({ _id: 'u-admin', firebaseUid: 'uid-admin', email: 'admin@x.com', name: 'Admin', role: 'admin', status: 'active' });
  db.push({ _id: 'u-editor', firebaseUid: 'uid-editor', email: 'editor@x.com', name: 'Editor', role: 'editor', status: 'active' });
}

const results = [];
async function test(name, fn) {
  seed();
  try {
    await fn();
    results.push(['PASS', name]);
  } catch (err) {
    results.push(['FAIL', name, err.message]);
  }
}

// ---- Tests -----------------------------------------------------------------
async function main() {
  const server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;

  await test('/api/me returns role and permissions for each staff level', async () => {
    const s = await call('GET', '/api/me', 'tok-super');
    assert.equal(s.status, 200);
    assert.equal(s.body.role, 'superadmin');
    assert.equal(s.body.permissions.manageAdmins, true);
    const e = await call('GET', '/api/me', 'tok-editor');
    assert.equal(e.body.role, 'editor');
    assert.equal(e.body.permissions.manageUsers, false);
    assert.equal(e.body.permissions.manageContent, true);
  });

  await test('requests without a token are rejected (401)', async () => {
    assert.equal((await call('GET', '/api/users')).status, 401);
  });

  await test('a valid Firebase login with no staff record is rejected (403)', async () => {
    fbUsers.set('stranger@x.com', { uid: 'uid-stranger', email: 'stranger@x.com' });
    assert.equal((await call('GET', '/api/me', 'tok-stranger')).status, 403);
  });

  await test('editors cannot open the user list (403)', async () => {
    assert.equal((await call('GET', '/api/users', 'tok-editor')).status, 403);
  });

  await test('admin sees the user list and can only assign the editor role', async () => {
    const r = await call('GET', '/api/users', 'tok-admin');
    assert.equal(r.status, 200);
    assert.deepEqual(r.body.assignableRoles, ['editor']);
  });

  await test('admin can add an editor and gets a one-time password setup link', async () => {
    const r = await call('POST', '/api/users', 'tok-admin', { email: 'new@x.com', name: 'New', role: 'editor' });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.role, 'editor');
    assert.ok(r.body.resetLink.includes('reset.example'), 'reset link returned for a brand-new account');
  });

  await test('admin CANNOT create another admin (403)', async () => {
    const r = await call('POST', '/api/users', 'tok-admin', { email: 'boss@x.com', name: 'Boss', role: 'admin' });
    assert.equal(r.status, 403);
  });

  await test('super admin can create an admin', async () => {
    const r = await call('POST', '/api/users', 'tok-super', { email: 'admin2@x.com', name: 'Second', role: 'admin' });
    assert.equal(r.status, 201);
    assert.equal(r.body.user.role, 'admin');
  });

  await test('creating a staff member whose email already exists is rejected (409)', async () => {
    assert.equal((await call('POST', '/api/users', 'tok-super', { email: 'editor@x.com', role: 'editor' })).status, 409);
  });

  await test('the Super Admin cannot be disabled by anyone (403)', async () => {
    assert.equal((await call('PATCH', '/api/users/u-super', 'tok-admin', { status: 'disabled' })).status, 403);
    assert.equal((await call('PATCH', '/api/users/u-super', 'tok-super', { status: 'disabled' })).status, 403);
  });

  await test('the Super Admin cannot be removed by anyone (403)', async () => {
    assert.equal((await call('DELETE', '/api/users/u-super', 'tok-admin')).status, 403);
    assert.equal((await call('DELETE', '/api/users/u-super', 'tok-super')).status, 403);
  });

  await test('nobody can change their own role or remove themselves', async () => {
    assert.equal((await call('PATCH', '/api/users/u-admin', 'tok-admin', { role: 'editor' })).status, 403);
    assert.equal((await call('DELETE', '/api/users/u-admin', 'tok-admin')).status, 403);
    assert.equal((await call('PATCH', '/api/users/u-super', 'tok-super', { role: 'editor' })).status, 403);
  });

  await test('an admin cannot manage another admin (same rank, 403)', async () => {
    await call('POST', '/api/users', 'tok-super', { email: 'admin2@x.com', name: 'Second', role: 'admin' });
    const second = [...db].find((d) => d.email === 'admin2@x.com');
    assert.equal((await call('PATCH', `/api/users/${second._id}`, 'tok-admin', { status: 'disabled' })).status, 403);
  });

  await test('super admin can demote an admin while other administrators remain', async () => {
    const r = await call('PATCH', '/api/users/u-admin', 'tok-super', { role: 'editor' });
    assert.equal(r.status, 200);
    assert.equal(r.body.role, 'editor');
  });

  await test('super admin can promote an editor to admin', async () => {
    const r = await call('PATCH', '/api/users/u-editor', 'tok-super', { role: 'admin' });
    assert.equal(r.status, 200);
    assert.equal(r.body.role, 'admin');
  });

  await test('editors cannot change users (403)', async () => {
    assert.equal((await call('PATCH', '/api/users/u-admin', 'tok-editor', { status: 'disabled' })).status, 403);
  });

  await test('a disabled staff member loses dashboard access (403)', async () => {
    const r = await call('PATCH', '/api/users/u-editor', 'tok-super', { status: 'disabled' });
    assert.equal(r.status, 200);
    assert.equal((await call('GET', '/api/me', 'tok-editor')).status, 403);
  });

  await test('profile sections enforce minimum roles (editor cannot edit contact)', async () => {
    assert.equal((await call('PUT', '/api/profile/contact', 'tok-editor', { email: 'a@b.co' })).status, 403);
  });

  await test('unknown profile section returns 404', async () => {
    assert.equal((await call('PUT', '/api/profile/nonsense', 'tok-super', {})).status, 404);
  });

  await test('the message inbox is admin-only (editor gets 403)', async () => {
    assert.equal((await call('GET', '/api/messages', 'tok-editor')).status, 403);
  });

  await test('upload deletion refuses paths outside portfolio/ (400)', async () => {
    assert.equal((await call('DELETE', '/api/uploads', 'tok-editor', { path: '../secret' })).status, 400);
  });

  await test('LAST ACTIVE ADMINISTRATOR rule: the only admin-level account cannot be removed', async () => {
    seed();
    db.find((d) => d._id === 'u-super').status = 'disabled';   // only one active admin-level account is left
    const onlyAdmin = db.find((d) => d._id === 'u-admin');
    assert.equal(await usersRoute.isLastActiveAdmin(onlyAdmin), true);
  });

  await test('LAST ACTIVE ADMINISTRATOR rule: removal allowed when another admin-level account exists', async () => {
    seed();
    const admin = db.find((d) => d._id === 'u-admin');
    assert.equal(await usersRoute.isLastActiveAdmin(admin), false, 'Super Admin is still active');
  });

  await test('role helper: super admin may assign admin + editor, admin may assign editor only', async () => {
    assert.deepEqual(usersRoute.assignableRoles('superadmin'), ['admin', 'editor']);
    assert.deepEqual(usersRoute.assignableRoles('admin'), ['editor']);
    assert.deepEqual(usersRoute.assignableRoles('editor'), []);
  });

  server.close();
  const failed = results.filter((r) => r[0] === 'FAIL');
  for (const [status, name, msg] of results) {
    console.log(`${status === 'PASS' ? 'PASS' : 'FAIL'}  ${name}${msg ? `\n      -> ${msg}` : ''}`);
  }
  console.log(`\n${results.length - failed.length} of ${results.length} tests passed.`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
