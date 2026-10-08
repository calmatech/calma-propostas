/* Runtime comum a todos os modelos de proposta:
   registra a visualização e cuida do botão "Aprovar proposta". */
(function () {
  var C = window.__CP__ || {};
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  var sid;
  try {
    sid = sessionStorage.getItem("cp_sid");
    if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("cp_sid", sid); }
  } catch (e) { sid = "x" + Math.random().toString(36).slice(2); }

  /* ---------- visualização ---------- */
  function track() {
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: C.slug, sid: sid, ref: document.referrer || "" }),
      keepalive: true
    }).catch(function () {});
  }
  if (C.preview) {
    var b = document.createElement("div");
    b.textContent = "Pré-visualização da equipe · este acesso não é contado";
    b.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;background:#222;color:#f4f4f2;font:500 13px/1 'Plus Jakarta Sans',sans-serif;padding:10px 16px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.2)";
    document.body.appendChild(b);
  } else if (document.visibilityState === "visible") {
    track();
  } else {
    document.addEventListener("visibilitychange", function on() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", on);
      track();
    });
  }

  /* ---------- aprovação ---------- */
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
  var fmtDate = function (iso) { return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }); };

  function setApproved(at, name) {
    $$("[data-approve]").forEach(function (b) { b.style.display = "none"; });
    $$("[data-cta]").forEach(function (a) { a.innerHTML = "Aprovada ✓"; });
    $$("[data-approved-slot]").forEach(function (s) {
      s.innerHTML = '<span class="ap-done"><i class="dot"></i>Aprovada' + (name ? " por " + esc(name) : "") + " em " + fmtDate(at) + "</span>";
    });
  }
  if (C.approvedAt) setApproved(C.approvedAt, C.approvedName);

  var dlg = document.createElement("dialog");
  dlg.className = "ap-dlg";
  dlg.innerHTML =
    '<form class="ap-box" method="dialog">' +
      '<span class="kicker" style="margin-bottom:10px">Aprovação</span>' +
      "<h3>Tudo certo por aí?</h3>" +
      '<p class="muted" style="margin:0">Ao confirmar, avisamos a equipe e enviamos o contrato para assinatura digital.</p>' +
      '<label for="ap-name">Seu nome</label><input id="ap-name" name="name" required autocomplete="name" maxlength="200">' +
      '<label for="ap-note">Algum recado? (opcional)</label><textarea id="ap-note" name="note" maxlength="2000"></textarea>' +
      '<p class="ap-err" hidden></p>' +
      '<div class="ap-acts"><button class="btn ghost" type="button" data-close>Voltar</button>' +
      '<button class="btn" type="submit" data-send>Confirmar aprovação <span class="ar">→</span></button></div>' +
    "</form>";
  document.body.appendChild(dlg);

  var form = dlg.querySelector("form"), err = dlg.querySelector(".ap-err"), send = dlg.querySelector("[data-send]");
  dlg.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  function done(at, name) {
    setApproved(at, name);
    form.innerHTML =
      '<span class="kicker" style="margin-bottom:10px">Proposta aprovada</span>' +
      "<h3>Que alegria, <em>" + esc(name.split(" ")[0]) + "</em>!</h3>" +
      '<p class="muted">Recebemos a sua aprovação. Em breve chega o contrato para assinatura, com os dados de pagamento.</p>' +
      '<div class="ap-acts">' +
      (C.contato ? '<a class="btn ghost" target="_blank" rel="noopener" href="' + esc(C.contato) + '">Falar com a gente</a>' : "") +
      '<button class="btn" type="button" data-close>Fechar</button></div>';
    form.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (C.preview) { err.hidden = false; err.textContent = "Pré-visualização: a aprovação fica desativada para a equipe."; return; }
    var name = dlg.querySelector("#ap-name").value.trim(), note = dlg.querySelector("#ap-note").value.trim();
    if (!name) return;
    send.disabled = true; err.hidden = true;
    fetch("/api/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: C.slug, sid: sid, name: name, note: note })
    })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || "Erro"); return j; }); })
      .then(function (j) { done(j.approvedAt, name); })
      .catch(function () {
        err.hidden = false;
        err.textContent = "Não conseguimos registrar agora. Tente de novo em instantes.";
        send.disabled = false;
      });
  });

  $$("[data-approve]").forEach(function (b) {
    b.addEventListener("click", function () { dlg.showModal(); setTimeout(function () { var i = dlg.querySelector("#ap-name"); if (i) i.focus(); }, 30); });
  });
})();
