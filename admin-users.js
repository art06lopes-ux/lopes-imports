import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword, 
  signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { 
  ref, 
  set, 
  get, 
  remove,
  onValue
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

// ============ HELPER FUNCTIONS ============

function showAlert(message, type = 'success') {
  const container = document.getElementById('alertContainer');
  const alertDiv = document.createElement('div');
  alertDiv.className = type === 'error' ? 'error' : 'success';
  alertDiv.textContent = message;
  container.innerHTML = '';
  container.appendChild(alertDiv);
  
  setTimeout(() => { alertDiv.remove(); }, 5000);
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
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateUsername(username) {
  const re = /^[a-zA-Z0-9._-]{3,}$/;
  return re.test(username);
}

// ============ CHECK ADMIN ACCESS ============

async function checkAdminAccess() {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      window.location.href = 'login.html';
      return false;
    }

    const userRef = ref(db, `users/${currentUser.uid}`);
    const snapshot = await get(userRef);
    
    if (!snapshot.exists()) {
      window.location.href = 'login.html';
      return false;
    }

    const userData = snapshot.val();
    if (userData.role !== 'admin') {
      alert('Acesso negado: apenas administradores.');
      window.location.href = 'index.html';
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro:', error);
    window.location.href = 'login.html';
    return false;
  }
}

// ============ LOAD AND RENDER USERS ============

function loadUsers() {
  try {
    const usersRef = ref(db, 'users');
    
    onValue(usersRef, (snapshot) => {
      const container = document.getElementById('usersContainer');
      
      if (!snapshot.exists()) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Nenhum usuário cadastrado.</p>';
        document.getElementById('userCount').textContent = '0';
        return;
      }

      const users = snapshot.val();
      const userArray = Object.keys(users).map(uid => ({ uid, ...users[uid] }));

      document.getElementById('userCount').textContent = userArray.length;

      let html = '';
      userArray.forEach(user => {
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
              <button class="btn btn-danger btn-small" onclick="deleteUserConfirm('${user.uid}', '${escapeHtml(user.username)}')">🗑️ Deletar</button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    });
  } catch (error) {
    console.error('Erro:', error);
    showAlert('Erro ao carregar usuários', 'error');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ============ CREATE USER ============

async function createUser() {
  const username = document.getElementById('newUsername').value.trim();
  const email = document.getElementById('newEmail').value.trim();
  let password = document.getElementById('newPassword').value;
  const role = document.getElementById('newRole').value;

  if (!username || !validateUsername(username)) {
    showAlert('Nome de usuário inválido (mín 3 caracteres, letras/números)', 'error');
    return;
  }

  if (!email || !validateEmail(email)) {
    showAlert('Email inválido', 'error');
    return;
  }

  if (!password) {
    password = generatePassword();
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    await set(ref(db, `users/${uid}`), {
      uid,
      username,
      email,
      role,
      createdAt: new Date().toISOString()
    });

    showAlert(`✅ Usuário "${username}" criado! Senha: ${password}`);
    
    document.getElementById('newUsername').value = '';
    document.getElementById('newEmail').value = '';
    document.getElementById('newPassword').value = '';

  } catch (error) {
    let errorMsg = 'Erro ao criar usuário';
    if (error.code === 'auth/email-already-in-use') errorMsg = 'Email já em uso';
    else if (error.code === 'auth/weak-password') errorMsg = 'Senha fraca (min 6 caracteres)';
    showAlert(errorMsg, 'error');
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
    const userCredential = await createUserWithEmailAndPassword(auth, emailToUse, password);
    const uid = userCredential.user.uid;

    await set(ref(db, `users/${uid}`), {
      uid,
      username,
      email: emailToUse,
      role: 'user',
      createdAt: new Date().toISOString()
    });

    const appUrl = window.location.origin + '/lopes-imports/';
    const inviteText = `╔════════════════════════════════════════╗
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
    showAlert(`✅ Convite gerado!`);
    document.getElementById('inviteUsername').value = '';
    document.getElementById('inviteEmail').value = '';

  } catch (error) {
    let errorMsg = 'Erro ao gerar convite';
    if (error.code === 'auth/email-already-in-use') errorMsg = 'Email já em uso';
    showAlert(errorMsg, 'error');
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

// ============ DELETE USER ============

window.deleteUserConfirm = async function(uid, username) {
  if (!confirm(`Deletar "${username}"? Não pode ser desfeito!`)) return;

  try {
    await remove(ref(db, `users/${uid}`));
    showAlert(`✅ Usuário deletado.`);
  } catch (error) {
    showAlert('Erro ao deletar: ' + error.message, 'error');
  }
};

// ============ EVENT LISTENERS ============

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await signOut(auth);
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

document.addEventListener('DOMContentLoaded', async () => {
  const hasAccess = await checkAdminAccess();
  if (hasAccess) loadUsers();
});
