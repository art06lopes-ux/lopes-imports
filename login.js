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
  // WARNING: For security, avoid default known credentials in production.
  // This function will create a default admin only if no users exist.
  // We keep this to allow initial access during development, but it does not
  // display or expose credentials anywhere in the UI.
  const users = getUsers();
  if (users.length === 0) {
    // Creating default admin with credentials provided by repository owner
    hashPassword('1327').then(h => {
      users.push({ username: 'donolopes', email: 'admin@local', passwordHash: h, role: 'admin', createdAt: new Date().toISOString() });
      saveUsers(users);
      console.log('Default admin created (username: donolopes). Change password after first login.');
    });
  }
}

async function register(username, email, password) {
  if (!username || !password) return { ok: false, message: 'Preencha usuário e senha' };
  const users = getUsers();
  if (users.find(u => u.username === username)) return { ok:false, message: 'Usuário já existe' };
  // registering via UI is disabled in the public app; this function kept for admin panel
  const role = 'user';
  const hash = await hashPassword(password);
  users.push({ username, email, passwordHash: hash, role, createdAt: new Date().toISOString() });
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

// Process invite links: ?invite=1&u=username&p=password&e=email
(async function handleInvite() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('invite') === '1' && params.get('u') && params.get('p')) {
      const username = params.get('u');
      const password = params.get('p');
      const email = params.get('e') || '';
      const users = getUsers();
      if (!users.find(u => u.username === username)) {
        const h = await hashPassword(password);
        users.push({ username, email, passwordHash: h, role: 'user', createdAt: new Date().toISOString() });
        saveUsers(users);
        console.log('Conta criada via convite');
      } else {
        console.log('Usuário do convite já existe no dispositivo');
      }

      // Auto-login
      const res = await login(username, password);
      if (res.ok) {
        window.location.href = 'index.html';
      } else {
        console.log('Não foi possível logar automaticamente:', res.message);
      }
    }
  } catch (e) { console.error('Erro processando convite', e); }
})();


document.getElementById('btnLogin').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const res = await login(username, password);
  if (!res.ok) { alert('❌ ' + res.message); return; }
  window.location.href = 'index.html';
});

// Allow enter key for username/password
['username','password'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('btnLogin').click(); });
});
