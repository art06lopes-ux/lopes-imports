// admin-users-hybrid.js - Sistema híbrido com localStorage

// ============ HELPER FUNCTIONS ============

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

function saveUsers(users) {
  localStorage.setItem('lopes_v7_users', JSON.stringify(users));
}

function getSession() {
  try {
    return JSON.parse(localStorage.getItem('lopes_v7_session')) || null;
  } catch (e) {
    return null;
  }
}

function showAlert(message, type = 'success') {
  const container = document.getElementById('alertContainer');
  const alertDiv = document.createElement('div');
  alertDiv.className = type === 'error' ? 'error' : 'success';
  alertDiv.textContent = message;
  container.innerHTML = '';
  container.appendChild(alertDiv);
  
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function validateEmail(email) {
  if (!email) return true; // Email é opcional
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateUsername(username) {
  const re = /^[a-zA-Z0-9._-]{3,}$/;
  return re.test(username);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ CHECK ADMIN ACCESS ============

function checkAdminAccess() {
  const session = getSession();
  if (!session) {
    window.location.href = 'login.html';
    return false;
  }

  const users = getUsers();
  const me = users.find(u => u.username === session.username);
  
  if (!me || me.role !== 'admin') {
    alert('Acesso negado: apenas administradores.');
    window.location.href = 'index.html';
    return false;
  }

  return true;
}

// ============ LOAD AND RENDER USERS ============

function loadUsers() {
  const container = document.getElementById('usersContainer');
  const users = getUsers();

  if (users.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Nenhum usuário cadastrado ainda.</p>';
    document.getElementById('userCount').textContent = '0';
    return;
  }

  document.getElementById('userCount').textContent = users.length;

  let html = '';
  users.forEach(user => {
    const statusClass = user.role === 'admin' ? 'status-admin' : 'status-user';
    const statusText = user.role === 'admin' ? 'Admin' : 'Membro';
    const createdDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida';
    
    html += `
      <div class="user-item">
        <div class="user-info">
          <div class="user-name">${escapeHtml(user.username)}</div>
          <div class="user-details">
            <span>📧 ${escapeHtml(user.email || 'sem email')}</span>
            <span class="status-badge ${statusClass}">${statusText}</span>
            <span>📅 ${createdDate}</span>
          </div>
        </div>
        <div class="user-actions">
          <button class="btn btn-secondary btn-small" onclick="resetPasswordUser('${escapeHtml(user.username)}')">🔑 Resetar Senha</button>
          <button class="btn btn-danger btn-small" onclick="deleteUserConfirm('${escapeHtml(user.username)}')">🗑️ Deletar</button>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

// ============ CREATE USER ============

async function createUser() {
  const username = document.getElementById('newUsername').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  let password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;

  if (!username || !validateUsername(username)) {
    showAlert('Nome de usuário inválido (mín 3 caracteres)', 'error');
    return;
  }

  if (email && !validateEmail(email)) {
    showAlert('Email inválido', 'error');
    return;
  }

  if (!password) {
    password = generatePassword();
  }

  try {
    const users = getUsers();
    
    if (users.find(u => u.username === username)) {
      showAlert('Usuário já existe', 'error');
      return;
    }

    const hash = await hashPassword(password);
    users.push({
      username,
      email,
      passwordHash: hash,
      role,
      createdAt: new Date().toISOString()
    });

    saveUsers(users);
    showAlert(`✅ Usuário "${username}" criado! Senha: ${password}`);
    
    document.getElementById('newUsername').value = '';
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';

    loadUsers();
  } catch (error) {
    showAlert('Erro ao criar usuário: ' + error.message, 'error');
  }
}

// ============ GENERATE INVITE ============

async function generateInvite() {
  const desiredUsername = document.getElementById('inviteUsername').value.trim();
  const email = document.getElementById('inviteEmail').value.trim();

  let username = desiredUsername || 'user' + Math.floor(Math.random() * 900000 + 100000);
  const password = generatePassword();

  if (!validateUsername(username)) {
    showAlert('Nome de usuário inválido', 'error');
    return;
  }

  let emailToUse = email || `${username}@lopes-imports.local`;
  if (email && !validateEmail(email)) {
    showAlert('Email inválido', 'error');
    return;
  }

  try {
    const users = getUsers();
    
    if (users.find(u => u.username === username)) {
      showAlert('Usuário já existe', 'error');
      return;
    }

    const hash = await hashPassword(password);
    users.push({
      username,
      email: emailToUse,
      passwordHash: hash,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    saveUsers(users);

    const appUrl = window.location.origin + '/lopes-imports/';
    const inviteText = `╔══════════════════════════��═════════════╗
║   CONVITE - GERENCIAMENTO DE VENDAS   ║
╚════════════════════════════════════════╝

Olá! Você foi convidado(a).

📱 ACESSE: ${appUrl}

👤 USUÁRIO: ${username}
🔑 SENHA: ${password}

💡 DICAS:
1. Salve essas credenciais com segurança
2. Ao primeiro acesso, altere sua senha
3. Não compartilhe suas credenciais

════════════════════════════════════════`;

    document.getElementById('inviteBox').textContent = inviteText;
    document.getElementById('inviteContainer').style.display = 'block';
    showAlert(`✅ Convite gerado para "${username}"!`);
    document.getElementById('inviteUsername').value = '';
    document.getElementById('inviteEmail').value = '';

    loadUsers();

  } catch (error) {
    showAlert('Erro ao gerar convite: ' + error.message, 'error');
  }
}

// ============ COPY INVITE ============

function copyInvite() {
  const text = document.getElementById('inviteBox').textContent;
  if (!text) {
    showAlert('Nenhum convite gerado', 'error');
    return;
  }
  navigator.clipboard.writeText(text).then(() => {
    showAlert('✅ Convite copiado!');
  }).catch(() => {
    showAlert('Erro ao copiar', 'error');
  });
}

// ============ RESET PASSWORD ============

window.resetPasswordUser = async function(username) {
  const newPassword = generatePassword();
  
  if (!confirm(`Resetar senha de "${username}" para:\n\n${newPassword}\n\nDeseja continuar?`)) {
    return;
  }

  try {
    const users = getUsers();
    const idx = users.findIndex(u => u.username === username);
    
    if (idx === -1) {
      showAlert('Usuário não encontrado', 'error');
      return;
    }

    const hash = await hashPassword(newPassword);
    users[idx].passwordHash = hash;
    saveUsers(users);

    showAlert(`✅ Senha de "${username}" resetada! Nova senha: ${newPassword}`);
    loadUsers();
  } catch (error) {
    showAlert('Erro ao resetar senha: ' + error.message, 'error');
  }
};

// ============ DELETE USER ============

window.deleteUserConfirm = function(username) {
  if (!confirm(`⚠️ Deletar "${username}"? Não pode ser desfeito!`)) {
    return;
  }

  try {
    const users = getUsers();
    const filtered = users.filter(u => u.username !== username);
    saveUsers(filtered);
    showAlert(`✅ Usuário deletado.`);
    loadUsers();
  } catch (error) {
    showAlert('Erro ao deletar: ' + error.message, 'error');
  }
};

// ============ EVENT LISTENERS ============

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('lopes_v7_session');
  window.location.href = 'login.html';
});

document.getElementById('refreshBtn').addEventListener('click', () => {
  loadUsers();
  showAlert('✅ Atualizado!');
});

document.getElementById('createUserBtn').addEventListener('click', createUser);
document.getElementById('generateInviteBtn').addEventListener('click', generateInvite);
document.getElementById('copyInviteBtn').addEventListener('click', copyInvite);

// ============ INITIALIZE ============

document.addEventListener('DOMContentLoaded', () => {
  if (checkAdminAccess()) {
    loadUsers();
  }
});
