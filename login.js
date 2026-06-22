// login.js - Autenticação com Firebase
import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import {
  ref,
  get
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js';

// ============ INITIALIZE ============

// Verificar se usuário já está logado
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Se já está logado, redireciona para home
    window.location.href = 'index.html';
  }
});

// ============ LOGIN FUNCTION ============

async function login(username, email, password) {
  try {
    // Login com Firebase usando email
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Verificar se o usuário existe no banco de dados
    const userRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // Se não existe no banco, faz logout
      await signOut(auth);
      return { ok: false, message: 'Erro: Usuário não configurado corretamente' };
    }

    const userData = snapshot.val();

    // Criar sessão local
    const session = {
      uid: user.uid,
      username: userData.username,
      email: userData.email,
      role: userData.role,
      token: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString()
    };

    localStorage.setItem('lopes_v7_session', JSON.stringify(session));
    localStorage.setItem('lopes_v7_user_uid', user.uid);

    return { ok: true, session };
  } catch (error) {
    console.error('Erro no login:', error);
    let message = 'Erro ao fazer login';

    if (error.code === 'auth/user-not-found') {
      message = 'Usuário não encontrado';
    } else if (error.code === 'auth/wrong-password') {
      message = 'Senha incorreta';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Email inválido';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Muitas tentativas. Tente novamente mais tarde.';
    }

    return { ok: false, message };
  }
}

// ============ EVENT LISTENERS ============

document.getElementById('btnLogin').addEventListener('click', async () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('❌ Preencha usuário e senha');
    return;
  }

  // Mostrar loading
  const btn = document.getElementById('btnLogin');
  const originalText = btn.textContent;
  btn.textContent = 'Carregando...';
  btn.disabled = true;

  try {
    // Procurar o usuário pelo username no banco de dados
    const usersRef = ref(db, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      alert('❌ Nenhum usuário cadastrado');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }

    const users = snapshot.val();
    const userEntry = Object.entries(users).find(([uid, userData]) => userData.username === username);

    if (!userEntry) {
      alert('❌ Usuário não encontrado');
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }

    const [uid, userData] = userEntry;
    const res = await login(username, userData.email, password);

    if (!res.ok) {
      alert('❌ ' + res.message);
      btn.textContent = originalText;
      btn.disabled = false;
      return;
    }

    // Login bem-sucedido
    alert('✅ Bem-vindo, ' + username + '!');
    window.location.href = 'index.html';

  } catch (error) {
    console.error('Erro:', error);
    alert('❌ Erro ao fazer login: ' + error.message);
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

// Permitir Enter nas inputs
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
