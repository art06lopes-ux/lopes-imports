// Data Management
let produtos = JSON.parse(localStorage.getItem('lopes_v7_produtos') || '[]');
let vendas = JSON.parse(localStorage.getItem('lopes_v7_vendas') || '[]');

// Save data to localStorage
function save() {
  localStorage.setItem('lopes_v7_produtos', JSON.stringify(produtos));
  localStorage.setItem('lopes_v7_vendas', JSON.stringify(vendas));
  render();
}

// Add new product
function add() {
  const nome = document.getElementById('nome').value.trim();
  const compra = parseFloat(document.getElementById('compra').value);
  const venda = parseFloat(document.getElementById('venda').value);
  const qtd = parseInt(document.getElementById('qtd').value);

  // Validation
  if (!nome || isNaN(compra) || isNaN(venda) || isNaN(qtd)) {
    alert('❌ Por favor, preencha todos os campos corretamente');
    return;
  }

  if (compra < 0 || venda < 0 || qtd < 1) {
    alert('❌ Os valores devem ser positivos');
    return;
  }

  if (venda < compra) {
    alert('⚠️ O preço de venda não pode ser menor que o preço de compra');
  }

  // Add product
  produtos.push({
    id: Date.now(),
    nome,
    compra,
    venda,
    qtd,
    vendidos: 0,
    lucroTotal: 0,
    dataCriacao: new Date().toISOString()
  });

  save();

  // Clear form
  document.getElementById('nome').value = '';
  document.getElementById('compra').value = '';
  document.getElementById('venda').value = '';
  document.getElementById('qtd').value = '';
  document.getElementById('nome').focus();
}

// Sell product
function vender(id) {
  const produto = produtos.find(p => p.id === id);

  if (!produto) {
    alert('❌ Produto não encontrado');
    return;
  }

  if (produto.qtd <= 0) {
    alert('❌ Produto sem estoque');
    return;
  }

  produto.qtd--;
  produto.vendidos++;

  const lucro = produto.venda - produto.compra;
  produto.lucroTotal += lucro;

  vendas.push({
    id: Date.now(),
    produtoId: produto.id,
    nomeProduto: produto.nome,
    lucro: lucro,
    precoVenda: produto.venda,
    precoCompra: produto.compra,
    data: new Date().toISOString()
  });

  save();
}

// Delete product
function deletarProduto(id) {
  if (confirm('Tem certeza que deseja deletar este produto?')) {
    produtos = produtos.filter(p => p.id !== id);
    save();
  }
}

// Check if date is in the same week
function mesmaSemana(data) {
  const agora = new Date();
  const inicio = new Date(agora);
  inicio.setDate(agora.getDate() - 7);
  return new Date(data) >= inicio;
}

// Check if date is today
function ehHoje(data) {
  const agora = new Date();
  const d = new Date(data);
  return d.toDateString() === agora.toDateString();
}

// Check if date is in current month
function ehMesAtual(data) {
  const agora = new Date();
  const d = new Date(data);
  return d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear();
}

// Check if date is in current year
function ehAnoAtual(data) {
  const agora = new Date();
  const d = new Date(data);
  return d.getFullYear() === agora.getFullYear();
}

// Render all products
function render() {
  let html = '';
  let estoque = 0;

  if (produtos.length === 0) {
    html = '<p style="text-align: center; color: #b0b0b0; padding: 20px;">Nenhum produto cadastrado ainda</p>';
  } else {
    produtos.forEach((p) => {
      estoque += p.qtd;
      const margemLucro = ((p.venda - p.compra) / p.compra * 100).toFixed(1);

      html += `
        <div class="produto">
          <b>${p.nome}</b>
          <div class="produto-info">💰 Compra: <strong>R$ ${p.compra.toFixed(2)}</strong></div>
          <div class="produto-info">💵 Venda: <strong>R$ ${p.venda.toFixed(2)}</strong></div>
          <div class="produto-info">📈 Margem: <strong>${margemLucro}%</strong></div>
          <div class="produto-info">📦 Estoque: <strong>${p.qtd}</strong></div>
          <div class="produto-info">✅ Vendidos: <strong>${p.vendidos}</strong></div>
          <div class="produto-info">🏆 Lucro Total: <strong>R$ ${p.lucroTotal.toFixed(2)}</strong></div>
          <button class="btn btn-sell" onclick="vender(${p.id})">🛒 Vender</button>
          <button class="btn btn-sell" style="background: #dc3545; margin-top: 8px;" onclick="deletarProduto(${p.id})">🗑️ Deletar</button>
        </div>
      `;
    });
  }

  document.getElementById('lista').innerHTML = html;
  document.getElementById('estoque').textContent = estoque;

  // Calculate statistics
  const agora = new Date();
  let hoje = 0, semana = 0, mes = 0, ano = 0, total = 0;

  vendas.forEach(v => {
    total += v.lucro;

    if (ehHoje(v.data)) hoje += v.lucro;
    if (mesmaSemana(v.data)) semana += v.lucro;
    if (ehMesAtual(v.data)) mes += v.lucro;
    if (ehAnoAtual(v.data)) ano += v.lucro;
  });

  // Update statistics
  document.getElementById('hoje').textContent = hoje.toFixed(2);
  document.getElementById('semana').textContent = semana.toFixed(2);
  document.getElementById('mes').textContent = mes.toFixed(2);
  document.getElementById('ano').textContent = ano.toFixed(2);
  document.getElementById('total').textContent = total.toFixed(2);

  // Render chart
  renderGrafico();
}

// Render monthly chart
function renderGrafico() {
  const meses = new Array(12).fill(0);
  const anoAtual = new Date().getFullYear();
  const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  vendas.forEach(v => {
    const d = new Date(v.data);
    if (d.getFullYear() === anoAtual) {
      meses[d.getMonth()] += v.lucro;
    }
  });

  const canvas = document.getElementById('graf');
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate max value
  const max = Math.max(...meses, 1);
  const padding = 30;
  const barWidth = 50;
  const barGap = 5;
  const chartHeight = canvas.height - 80;

  // Draw bars
  meses.forEach((valor, i) => {
    const h = (valor / max) * chartHeight;
    const x = padding + i * (barWidth + barGap);
    const y = canvas.height - 30 - h;

    // Bar
    ctx.fillStyle = '#0066cc';
    ctx.fillRect(x, y, barWidth, h);

    // Border
    ctx.strokeStyle = '#004499';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, barWidth, h);

    // Month label
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(nomesMeses[i], x + barWidth / 2, canvas.height - 10);

    // Value label
    if (valor > 0) {
      ctx.fillStyle = '#004499';
      ctx.font = 'bold 11px Arial';
      ctx.fillText('R$ ' + valor.toFixed(0), x + barWidth / 2, y - 5);
    }
  });
}

// Update clock
function atualizarRelogio() {
  const agora = new Date();
  const opcoes = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  document.getElementById('clock').textContent = agora.toLocaleString('pt-BR', opcoes);
}

// Initialize
window.addEventListener('load', () => {
  render();
  atualizarRelogio();
  setInterval(atualizarRelogio, 1000);
});

// Allow Enter key to add product
document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('#produtoForm input');
  inputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        add();
      }
    });
  });
});