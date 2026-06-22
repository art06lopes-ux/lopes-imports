import { db } from './firebase-config.js';
import {
  ref,
  set,
  get,
  push
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

// ============ GENERATE UID ============

function generateUID() {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// ============ MIGRATION ============

async function migrateUsers() {
  log('Iniciando migração simplificada...', 'info');
  
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

      // Gerar um UID único
      const uid = generateUID();
      
      // Preparar dados do usuário
      const userData = {
        uid,
        username: user.username,
        email: user.email || `${user.username}@lopes-imports.local`,
        role: user.role || 'user',
        passwordHash: user.passwordHash || '', // Mantém a senha antiga (hash)
        migratedFrom: 'localStorage',
        migratedAt: new Date().toISOString(),
        createdAt: user.createdAt || new Date().toISOString(),
        lastLogin: user.lastLogin || null
      };

      // Salvar no Realtime Database
      await set(ref(db, `users/${uid}`), userData);

      log(`  ✓ Usuário "${user.username}" migrado com sucesso!`, 'success');
      log(`  ✓ UID: ${uid.substring(0, 12)}...`, 'success');

      successCount++;
      updateStats(oldUsers.length, successCount);

    } catch (error) {
      errorCount++;
      log(`  ✗ Erro ao migrar "${user.username}": ${error.message}`, 'error');
      updateStats(oldUsers.length, successCount);
    }

    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 300));
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
    <strong>✅ BOAS NOTÍCIAS:</strong><br>
    Seus usuários antigos agora estão no Firebase!<br>
    Você pode fazer login com suas credenciais antigos normalmente.
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
