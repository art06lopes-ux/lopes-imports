// users.js - Painel de administração de usuários (apenas admin)

async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getUsers() { try { return JSON.parse(localStorage.getItem('lopes_v7_users') || '[]'); } catch(e){ return []; } }
function saveUsers(users) { localStorage.setItem('lopes_v7_users', JSON.stringify(users)); }
function getSession() { try { return JSON.parse(localStorage.getItem('lopes_v7_session')) || null; } catch(e){ return null; } }

function requireAdmin() {
  const session = getSession();
  if (!session) { window.location.href = 'login.html'; return false; }
  const users = getUsers();
  const me = users.find(u => u.username === session.username);
  if (!me || me.role !== 'admin') { alert('Acesso negado: apenas administradores'); window.location.href = 'index.html'; return false; }
  return true;
}

function renderUsers() {
  const container = document.getElementById('usersContainer');
  const users = getUsers();
  if (users.length === 0) { container.innerHTML = '<p style="color:#b0b0b0;">Nenhum usuário encontrado.</p>'; return; }

  let html = '';
  users.forEach(u => {
    html += `
      <div class="user-row" style="background:var(--input-bg); border:1px solid var(--border-color);">
        <div>
          <strong>${u.username}</strong> <span style="color:var(--text-secondary);">${u.email || ''}</span>
          <div style="color:var(--text-secondary); font-size:0.9em;">Role: ${u.role || 'user'} • Criado: ${new Date(u.createdAt).toLocaleString()}</div>
        </div>
        <div class="user-actions">
          <button class="btn" onclick="promptReset('${u.username}')">Reset Senha</button>
          <button class="btn" style="background:#dc3545;" onclick="deleteUser('${u.username}')">Excluir</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function promptReset(username) {
  if (!confirm('Deseja resetar a senha para este usuário? Você poderá definir a nova senha manualmente na próxima tela.')) return;
  const nova = prompt('Digite a nova senha para ' + username + ' (deixe em branco para gerar uma senha aleatória):');
  let newPass = nova;
  if (!newPass) {
    newPass = Math.random().toString(36).slice(2,10);
    alert('Senha gerada: ' + newPass);
  }
  const h = await hashPassword(newPass);
  const users = getUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx === -1) { alert('Usuário não encontrado'); return; }
  users[idx].passwordHash = h;
  saveUsers(users);
  alert('Senha atualizada com sucesso.');
  renderUsers();
}

function deleteUser(username) {
  if (!confirm('Excluir usuário ' + username + '? Esta ação não pode ser desfeita.')) return;
  const users = getUsers();
  const filtered = users.filter(u => u.username !== username);
  saveUsers(filtered);
  alert('Usuário excluído.');
  renderUsers();
}

// create user from admin panel
document.addEventListener('DOMContentLoaded', () => {
  if (!requireAdmin()) return;

  document.getElementById('backBtn').addEventListener('click', () => { window.location.href = 'index.html'; });
  document.getElementById('logoutBtn').addEventListener('click', () => { localStorage.removeItem('lopes_v7_session'); window.location.href = 'login.html'; });

  renderUsers();

  document.getElementById('createUserBtn').addEventListener('click', async () => {
    const username = document.getElementById('newUsername').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const password = document.getElementById('newPassword').value;
    if (!username || !password) { alert('Preencha usuário e senha'); return; }
    const users = getUsers();
    if (users.find(u => u.username === username)) { alert('Usuário já existe'); return; }
    const h = await hashPassword(password);
    users.push({ username, email, passwordHash: h, role: 'user', createdAt: new Date().toISOString() });
    saveUsers(users);
    document.getElementById('newUsername').value = '';
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';
    alert('Usuário criado com sucesso');
    renderUsers();
  });
});
