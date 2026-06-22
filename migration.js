import { auth, db } from './firebase-config.js';
import { 
  createUserWithEmailAndPassword,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  ref,
  set,
  get
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

// ============ HELPERS ============

function log(message, type = 'info') {
  const statusLog = document.getElementById('statusLog');
  const logLine = document.createElement('div');
  logLine.className = `log-line log-${type}`;
  
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  logLine.textContent = `[${timestamp}] ${message}`;
  
  statusLog.appendChild(logLine);
  statusLog.scrollTop = statusLog.scrollHeight;
}

function updateProgress(current, total) {
  const percentage = (current / total) * 100;
  document.getElementById('progressFill').style.width = percentage + '%';
}

function updateStats(found, success) {
  document.getElementById('foundCount').textContent = found;
  document.getElementById('successCount').textContent = success;
}

// ============ GET OLD USERS ============

function getOldUsers() {
  try {
    const users = JSON.parse(localStorage.getItem('lopes_v7_users') || '[]');
    return users;
  } catch (e) {
    log('Erro ao ler usuários antigos: ' + e.message, 'error');
    return [];
  }
}

// ============ MIGRATION ============

async function migrateUsers() {
  log('Iniciando migração...', 'info');
  
  const oldUsers = getOldUsers();
  
  if (oldUsers.length === 0) {
    log('Nenhum usuário encontrado para migrar', 'info');
    updateStats(0, 0);
    completeMessage('Nenhum usuário foi encontrado. Você pode criar novos usuários no painel de administração.');
    return;
  }

  log(`${oldUsers.length} usuário(s) encontrado(s)`, 'info');
  updateStats(oldUsers.length, 0);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < oldUsers.length; i++) {
    const user = oldUsers[i];
    
    try {
      log(`Migrando usuário ${i + 1}/${oldUsers.length}: ${user.username}...`, 'info');

      // Criar um email único baseado no username
      const email = user.email || `${user.username}@lopes-imports.local`;
      
      // Gerar uma senha segura aleatória (não usaremos a hash antiga)
      const tempPassword = Math.random().toString(36).slice(2, 15) + Math.random().toString(36).slice(2, 15);

      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      const uid = userCredential.user.uid;

      log(`  ✓ Conta Firebase criada (UID: ${uid.substring(0, 8)}...)`, 'success');

      // Salvar dados do usuário no Realtime Database
      await set(ref(db, `users/${uid}`), {
        uid,
        username: user.username,
        email,
        role: user.role || 'user',
        migratedFrom: 'localStorage',
        migratedAt: new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null
      });

      log(`  ✓ Dados salvos no Firebase`, 'success');
      log(`  ⚠️  IMPORTANTE: Este usuário precisa resetar a senha!`, 'info');

      successCount++;
      updateStats(oldUsers.length, successCount);

    } catch (error) {
      errorCount++;
      log(`  ✗ Erro ao migrar: ${error.message}`, 'error');
      updateStats(oldUsers.length, successCount);
    }

    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  log(``, 'info');
  log(`Migração concluída!`, 'success');
  log(`✅ ${successCount} usuário(s) migrado(s) com sucesso`, 'success');
  
  if (errorCount > 0) {
    log(`❌ ${errorCount} erro(s) durante a migração`, 'error');
  }

  completeMessage(`
    ✅ <strong>${successCount}</strong> usuário(s) foram migrados com sucesso!<br><br>
    ${errorCount > 0 ? `❌ ${errorCount} erro(s) ocorreram durante a migração.<br><br>` : ''}
    <strong>⚠️ IMPORTANTE:</strong><br>
    Todos os usuários migrados precisam <strong>resetar suas senhas</strong> no login.<br>
    Você pode redefini-las no painel de administração antes de compartilhar as credenciais.
  `);
}

function completeMessage(message) {
  document.querySelector('.migration-card').style.display = 'none';
  const completeCard = document.getElementById('completeCard');
  document.getElementById('completeMessage').innerHTML = message;
  completeCard.style.display = 'block';
}

// ============ EVENT LISTENERS ============

document.getElementById('startBtn').addEventListener('click', async () => {
  const btn = document.getElementById('startBtn');
  btn.disabled = true;
  btn.textContent = 'Migrando...';
  
  document.getElementById('skipBtn').disabled = true;

  try {
    await migrateUsers();
  } catch (error) {
    log('Erro geral: ' + error.message, 'error');
    completeMessage(`
      ❌ Erro durante a migração: ${error.message}<br><br>
      Por favor, tente novamente ou entre em contato com o suporte.
    `);
  }
});

document.getElementById('skipBtn').addEventListener('click', () => {
  if (confirm('⚠️ Tem certeza? Seus usuários antigos não serão migrados. Você pode usar o painel admin para criar novos usuários manualmente.')) {
    localStorage.setItem('lopes_v7_migration_skipped', 'true');
    window.location.href = 'login.html';
  }
});

document.getElementById('continueBtn').addEventListener('click', () => {
  localStorage.setItem('lopes_v7_migration_completed', 'true');
  window.location.href = 'login.html';
});

// ============ INITIALIZE ============

log('Página de migração carregada', 'info');
log('Verificando usuários antigos...', 'info');

const oldUsers = getOldUsers();
if (oldUsers.length === 0) {
  log('Nenhum usuário encontrado', 'info');
  document.getElementById('startBtn').disabled = true;
  document.getElementById('startBtn').textContent = 'Nenhum usuário para migrar';
}
