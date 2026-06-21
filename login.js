// login.js - Autenticação local com hashing SHA-256

// Helpers
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('lopes_v7_users') || '[]'); } catch(e){ return []; }
}

function saveUsers(users) { localStorage.setItem('lopes_v7_users', JSON.stringify(users)); }

function createDefaultAdminIfNeeded() {
  const users = getUsers();
  if (users.length === 0) {
    hashPassword('admin123').then(h => {
      users.push({ username: 'admin', email: 'admin@local', passwordHash: h, createdAt: new Date().toISOString() });
      saveUsers(users);
      console.log('Usuário admin criado');
    });
  }
}

async function register(username, email, password) {
  if (!username || !password) return { ok: false, message: 'Preencha usuário e senha' };
  const users = getUsers();
  if (users.find(u => u.username === username)) return { ok:false, message: 'Usuário já existe' };
  const hash = await hashPassword(password);
  users.push({ username, email, passwordHash: hash, createdAt: new Date().toISOString() });
  saveUsers(users);
  return { ok:true };
}

async function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  if (!user) return { ok:false, message: 'Usuário não encontrado' };
  const hash = await hashPassword(password);
  if (hash !== user.passwordHash) return { ok:false, message: 'Senha incorreta' };
  // create session
  const session = { username: user.username, token: Math.random().toString(36).slice(2), createdAt: new Date().toISOString() };
  localStorage.setItem('lopes_v7_session', JSON.stringify(session));
  return { ok:true, session };
}

// UI wiring
createDefaultAdminIfNeeded();

document.getElementById('btnRegister').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const res = await register(username, email, password);
  if (!res.ok) alert('❌ ' + res.message);
  else { alert('✅ Usuário registrado. Agora faça login.'); }
});

document.getElementById('btnLogin').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const res = await login(username, password);
  if (!res.ok) { alert('❌ ' + res.message); return; }
  window.location.href = 'index.html';
});

// Allow enter key
['username','password'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('btnLogin').click(); });
});
