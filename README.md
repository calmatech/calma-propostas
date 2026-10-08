# Calma · Propostas

Gerador de propostas do Estúdio Calma.

- **Painel** (só a equipe): `propostas.estudiocalma.com.br/admin`
- **Proposta pública**: `propostas.estudiocalma.com.br/p/<slug>` (não indexável)
- **Link curto**: `s.tudio.cc/<código>` → redireciona para a proposta

Stack: Next.js 16 (Vercel) + Supabase (Postgres + Auth).

## Como funciona

| O quê | Onde |
|---|---|
| Modelo HTML da proposta | `templates/calma-v1.html` (original em `templates/calma-v1.original.html`) |
| Campos e valores padrão do modelo | `src/lib/templates/calma-v1.ts` |
| Registro de modelos | `src/lib/templates/index.ts` |
| Aprovação + registro de acesso (JS comum aos modelos) | `public/proposta-runtime.js` |
| Banco | `supabase/schema.sql` |
| Encurtador (`s.tudio.cc/x` → `/l/x`) | `src/proxy.ts` + `src/app/l/[code]/route.ts` |

**Rastreamento (jornada do cliente)**
- *Clicou no link*: o link curto redireciona para `/p/<slug>?c=<código>` e o clique é contado na página da proposta, onde dá para saber se é alguém da equipe. Robôs de pré-visualização (WhatsApp, iMessage, Slack…) são ignorados.
- *Abriu a proposta*: o navegador avisa quando a página abre de verdade (precisa de JavaScript, então robô não conta).
- *Seções vistas*: cada `<section data-track="nome">` conta quando fica 1,5 s na tela (uma vez por sessão). `investimento` marca “Chegou no investimento”.
- *Clicou em Aprovar*: abrir a janela de confirmação, mesmo sem enviar.
- *Confirmou a aprovação*: nome + recado enviados.
- **Equipe não conta**: quem está logado, ou já entrou no painel naquele navegador (selo `cp_team`, 1 ano), vê a proposta em modo pré-visualização: nada é contado e a aprovação fica desativada.

**Não indexável**: `robots.txt` bloqueia tudo, header `X-Robots-Tag: noindex` em todas as respostas, `<meta name="robots">` no modelo e URLs com slug aleatório de 14 caracteres.

## Novo modelo

1. Copie `templates/calma-v1.html` para `templates/<id>.html`. Mantenha os marcadores `<!--__HEAD__-->`, `const P = /*__DATA__*/{};` e `<!--__RUNTIME__-->`, e um botão com `data-approve`.
2. Registre em `src/lib/templates/index.ts` com os valores padrão.
3. No painel, modelos sem formulário próprio são editados pela aba **Avançado (JSON)**.

## Publicação

### 1. Supabase
1. Crie um projeto em supabase.com (região São Paulo).
2. **SQL Editor** → cole `supabase/schema.sql` → Run. Depois, na ordem, cada arquivo de `supabase/migrations/`.
3. **Authentication → Sign In / Providers**: desligue “Allow new users to sign up”.
4. **Authentication → Users → Add user**: crie o login de cada pessoa da equipe (marque “Auto confirm”).
5. **Project Settings → API Keys**: copie a URL, a *publishable key* e a *secret key*.

### 2. Vercel
1. Suba esta pasta para um repositório no GitHub e importe na Vercel (ou rode `npx vercel` aqui).
2. Em **Settings → Environment Variables**, cadastre as variáveis de `.env.example`.
3. **Settings → Domains**: adicione `propostas.estudiocalma.com.br` e `s.tudio.cc`.

### 3. DNS
- No DNS de `estudiocalma.com.br`: `CNAME propostas → <valor que a Vercel mostrar>`
- No DNS de `tudio.cc`: `CNAME s → <valor que a Vercel mostrar>`

Pronto: entre em `propostas.estudiocalma.com.br`, faça login e crie a primeira proposta.

## Desenvolvimento

```bash
cp .env.example .env.local   # preencha com as chaves do Supabase
pnpm install
pnpm dev
```
Localmente, links curtos funcionam em `http://localhost:3000/l/<código>`.
