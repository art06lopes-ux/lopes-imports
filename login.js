// login.js - Login simples com localStorage

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem('lopes_v7_users') || '[]');
  } catch (e) {
    return [];
  }
}

async function login(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username);
  
  if (!user) {
    return { ok: false, message: 'Usuário não encontrado' };
  }

  const hash = await hashPassword(password);
  
  if (hash !== user.passwordHash) {
    return { ok: false, message: 'Senha incorreta' };
  }

  const session = {
    username: user.username,
    token: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString()
  };

  localStorage.setItem('lopes_v7_session', JSON.stringify(session));
  return { ok: true, session };
}

// Criar admin padrão se não existir ninguém
(function initializeAdmin() {
  const users = getUsers();
  if (users.length === 0) {
    hashPassword('1327').then(h => {
      users.push({
        username: 'donolopes',
        email: 'admin@local',
        passwordHash: h,
        role: 'admin',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('lopes_v7_users', JSON.stringify(users));
    });
  }
})();

document.getElementById('btnLogin').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('❌ Preencha usuário e senha');
    return;
  }

  const res = await login(username, password);
  
  if (!res.ok) {
    alert('❌ ' + res.message);
    return;
  }

  alert('✅ Bem-vindo, ' + username + '!');
  window.location.href = 'index.html';
});

['username', 'password'].forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        document.getElementById('btnLogin').click();
      }
    });
  }
});
