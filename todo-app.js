// Data Management
let tarefas = JSON.parse(localStorage.getItem('tarefas_list') || '[]');
let filtroAtual = 'todas';

// Initialize
window.addEventListener('load', () => {
  renderTarefas();
  atualizarEstatisticas();
  
  // Allow Enter key to add task
  document.getElementById('taskInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      adicionarTarefa();
    }
  });
});

// Save data to localStorage
function salvarDados() {
  localStorage.setItem('tarefas_list', JSON.stringify(tarefas));
}

// Add new task
function adicionarTarefa() {
  const input = document.getElementById('taskInput');
  const texto = input.value.trim();

  if (!texto) {
    alert('⚠️ Digite uma tarefa antes de adicionar!');
    return;
  }

  if (texto.length > 200) {
    alert('⚠️ A tarefa não pode ter mais de 200 caracteres!');
    return;
  }

  const tarefa = {
    id: Date.now(),
    texto: texto,
    concluida: false,
    prioridade: 'media',
    dataCriacao: new Date().toISOString(),
    dataConcluso: null
  };

  tarefas.unshift(tarefa);
  salvarDados();
  input.value = '';
  input.focus();
  renderTarefas();
  atualizarEstatisticas();
}

// Toggle task completion
function alternarConclusao(id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (tarefa) {
    tarefa.concluida = !tarefa.concluida;
    tarefa.dataConcluso = tarefa.concluida ? new Date().toISOString() : null;
    salvarDados();
    renderTarefas();
    atualizarEstatisticas();
  }
}

// Delete task
function deletarTarefa(id) {
  if (confirm('✓ Tem certeza que deseja deletar esta tarefa?')) {
    tarefas = tarefas.filter(t => t.id !== id);
    salvarDados();
    renderTarefas();
    atualizarEstatisticas();
  }
}

// Change priority
function mudarPrioridade(id, novaPrioridade) {
  const tarefa = tarefas.find(t => t.id === id);
  if (tarefa) {
    tarefa.prioridade = novaPrioridade;
    salvarDados();
    renderTarefas();
  }
}

// Filter tasks
function filtrarTarefas(tipo) {
  filtroAtual = tipo;
  
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderTarefas();
}

// Get filtered tasks
function obterTarefasFiltradas() {
  if (filtroAtual === 'todas') {
    return tarefas;
  } else if (filtroAtual === 'ativas') {
    return tarefas.filter(t => !t.concluida);
  } else if (filtroAtual === 'concluidas') {
    return tarefas.filter(t => t.concluida);
  }
}

// Render tasks
function renderTarefas() {
  const lista = document.getElementById('tarefasList');
  const emptyState = document.getElementById('emptyState');
  const tarefasFiltradas = obterTarefasFiltradas();

  if (tarefasFiltradas.length === 0) {
    lista.innerHTML = '';
    emptyState.classList.add('show');
    return;
  }

  emptyState.classList.remove('show');

  lista.innerHTML = tarefasFiltradas.map(tarefa => `
    <div class="tarefa-item ${tarefa.concluida ? 'concluida' : ''}">
      <input 
        type="checkbox" 
        class="tarefa-checkbox"
        ${tarefa.concluida ? 'checked' : ''}
        onchange="alternarConclusao(${tarefa.id})"
      >
      <div style="flex: 1;">
        <div class="tarefa-texto">${escaparHTML(tarefa.texto)}</div>
        <div style="margin-top: 6px;">
          <span class="tarefa-prioridade prioridade-${tarefa.prioridade}">${getPrioridadeLabel(tarefa.prioridade)}</span>
        </div>
      </div>
      <span class="tarefa-data">${formatarData(tarefa.dataCriacao)}</span>
      <div class="tarefa-acoes">
        <select class="btn-icon" onchange="mudarPrioridade(${tarefa.id}, this.value)" style="background: rgba(79, 70, 229, 0.1); color: var(--text-primary); border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer;">
          <option value="alta" ${tarefa.prioridade === 'alta' ? 'selected' : ''}>🔴 Alta</option>
          <option value="media" ${tarefa.prioridade === 'media' ? 'selected' : ''}>🟡 Média</option>
          <option value="baixa" ${tarefa.prioridade === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
        </select>
        <button class="btn-icon delete" onclick="deletarTarefa(${tarefa.id})" title="Deletar">🗑️</button>
      </div>
    </div>
  `).join('');
}

// Update statistics
function atualizarEstatisticas() {
  const total = tarefas.length;
  const ativas = tarefas.filter(t => !t.concluida).length;
  const concluidas = tarefas.filter(t => t.concluida).length;
  const progresso = total === 0 ? 0 : Math.round((concluidas / total) * 100);

  // Update counters
  document.getElementById('total').textContent = total;
  document.getElementById('ativas').textContent = ativas;
  document.getElementById('concluidas').textContent = concluidas;

  // Update stats
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statAtivas').textContent = ativas;
  document.getElementById('statConcluidas').textContent = concluidas;
  document.getElementById('statProgresso').textContent = progresso + '%';
}

// Mark all as completed
function marcarTodasConcluidas() {
  if (tarefas.length === 0) {
    alert('⚠️ Não há tarefas para marcar como concluídas!');
    return;
  }

  if (confirm('✓ Marcar TODAS as tarefas como concluídas?')) {
    tarefas.forEach(tarefa => {
      if (!tarefa.concluida) {
        tarefa.concluida = true;
        tarefa.dataConcluso = new Date().toISOString();
      }
    });
    salvarDados();
    renderTarefas();
    atualizarEstatisticas();
    alert('✅ Todas as tarefas foram marcadas como concluídas!');
  }
}

// Clear completed tasks
function limparConcluidas() {
  const concluidas = tarefas.filter(t => t.concluida).length;

  if (concluidas === 0) {
    alert('⚠️ Não há tarefas concluídas para limpar!');
    return;
  }

  if (confirm(`🗑️ Deletar ${concluidas} tarefa(s) concluída(s)?`)) {
    tarefas = tarefas.filter(t => !t.concluida);
    salvarDados();
    renderTarefas();
    atualizarEstatisticas();
    alert(`✅ ${concluidas} tarefa(s) deletada(s)!`);
  }
}

// Clear all tasks
function limparTodas() {
  if (tarefas.length === 0) {
    alert('⚠️ Não há tarefas para deletar!');
    return;
  }

  if (confirm('⚠️ DELETAR TODAS AS TAREFAS? Esta ação não pode ser desfeita!')) {
    if (confirm('❌ Tem absoluta certeza?')) {
      tarefas = [];
      salvarDados();
      renderTarefas();
      atualizarEstatisticas();
      alert('🗑️ Todas as tarefas foram deletadas!');
    }
  }
}

// Utility Functions
function getPrioridadeLabel(prioridade) {
  const labels = {
    'alta': '🔴 Alta',
    'media': '🟡 Média',
    'baixa': '🟢 Baixa'
  };
  return labels[prioridade] || 'Média';
}

function formatarData(dataISO) {
  const data = new Date(dataISO);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);

  if (data.toDateString() === hoje.toDateString()) {
    return 'Hoje';
  } else if (data.toDateString() === ontem.toDateString()) {
    return 'Ontem';
  }

  return data.toLocaleDateString('pt-BR');
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}
