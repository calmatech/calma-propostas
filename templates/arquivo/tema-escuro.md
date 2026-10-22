# Arquivo: tema escuro da proposta

Removido em 22/10/2026 — a proposta passou a ser **só modo claro**.
Commit anterior à remoção: `25c81c4` (tudo pode ser recuperado pelo git).

## CSS (ficava em `templates/calma-v1.html`, logo após `:root{...}`)

```css
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--paper:#181818;--ink:#EDEDEA;--muted:#9D9D99;--line:#333331;--card:#222;--tint:#202020}}
:root[data-theme="dark"]{--paper:#181818;--ink:#EDEDEA;--muted:#9D9D99;--line:#333331;--card:#222;--tint:#202020}
```

## Seletor de tema na faixa da equipe (`public/proposta-runtime.js`)

```js
    // faixa da equipe + seletor de tema (Auto segue o sistema)
    var st = document.createElement("style");
    st.textContent =
      ".cp-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:12px;max-width:calc(100vw - 24px);background:#222;color:#f4f4f2;font:500 13px/1 'Plus Jakarta Sans',sans-serif;padding:6px 6px 6px 16px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.25)}" +
      ".cp-bar span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}" +
      ".cp-th{display:flex;background:#3a3a3a;border-radius:999px;padding:2px;flex:none}" +
      ".cp-th button{font:inherit;font-size:12px;color:#bdbdb8;background:none;border:0;border-radius:999px;padding:6px 10px;cursor:pointer}" +
      ".cp-th button[aria-pressed=true]{background:#f4f4f2;color:#222}" +
      "@media (max-width:520px){.cp-bar .cp-long{display:none}}" +
      "@media print{.cp-bar{display:none}}";
    document.head.appendChild(st);

    var b = document.createElement("div");
    b.className = "cp-bar";
    b.innerHTML = '<span>Pré-visualização<span class="cp-long"> da equipe · este acesso não é contado</span></span>' +
      '<div class="cp-th" role="group" aria-label="Tema">' +
      '<button type="button" data-th="auto">Auto</button><button type="button" data-th="light">Claro</button><button type="button" data-th="dark">Escuro</button></div>';
    document.body.appendChild(b);

    var root = document.documentElement;
    function theme(t) {
      if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
      b.querySelectorAll("[data-th]").forEach(function (x) { x.setAttribute("aria-pressed", String(x.getAttribute("data-th") === t)); });
      try { localStorage.setItem("cp_theme", t); } catch (e) {}
    }
    var saved = "auto";
    try { saved = localStorage.getItem("cp_theme") || "auto"; } catch (e) {}
    theme(saved);
    b.addEventListener("click", function (e) { var x = e.target.closest("[data-th]"); if (x) theme(x.getAttribute("data-th")); });
```
