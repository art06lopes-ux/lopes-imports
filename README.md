# Gerenciamento de Vendas (anteriormente Lopes Imports Pro V7)

Sistema de Gestão de Vendas moderno e responsivo. Essa versão adiciona autenticação local (login/senha) para testes e uma nova página de vendas com receita total, lucro total e lista de produtos vendidos.

> Nota: A autenticação local usa armazenamento no navegador (localStorage) e hashing SHA-256. Isso é suficiente para uma demo, mas não é recomendado para produção. Para um sistema seguro e multi-usuário, use um backend + banco de dados ou um provedor como Firebase Auth.

## Alterações principais

- Renomeado o projeto para **Gerenciamento de Vendas**
- Adicionada autenticação local (login.html + login.js)
- Exposto "Receita Total" (soma dos preços de venda)
- Lista de produtos vendidos na interface
- Proteção de rota: exige login para acessar o app

## Como usar (rápido)

1. Abra `login.html` para registrar um usuário ou usar o usuário padrão.
2. Usuário padrão criado automaticamente (somente se não houver usuários):
   - Usuário: `admin`
   - Senha: `admin123`
3. Após login você será redirecionado para a aplicação (`index.html`).

## Observações
- Dados de produtos e vendas são armazenados em localStorage: `lopes_v7_produtos` e `lopes_v7_vendas`.
- Usuários e sessão também ficam em localStorage: `lopes_v7_users`, `lopes_v7_session`.

## Próximos passos recomendados
- Mudar para Firebase Auth ou construir um backend com Express + bcrypt + JWT para produção.

---

Versão: 7.1
Última atualização: 2026
