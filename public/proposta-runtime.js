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

  /* ---------- rastreamento ---------- */
  // remove ?c=código (clique do link curto já contado no servidor) para não recontar no recarregar
  try {
    var u = new URL(location.href);
    if (u.searchParams.has("c")) { u.searchParams.delete("c"); history.replaceState(null, "", u.pathname + u.search + u.hash); }
  } catch (e) {}

  function send(type, detail) {
    if (C.preview) return;
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug: C.slug, sid: sid, type: type, detail: detail || "", ref: document.referrer || "" }),
      keepalive: true
    }).catch(function () {});
  }
  // uma vez por sessão do navegador
  function once(key, fn) {
    try { if (sessionStorage.getItem("cp_" + key)) return; sessionStorage.setItem("cp_" + key, "1"); } catch (e) {}
    fn();
  }

  if (C.preview) {
    var b = document.createElement("div");
    b.textContent = "Pré-visualização da equipe · este acesso não é contado";
    b.style.cssText = "position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:50;background:#222;color:#f4f4f2;font:500 13px/1 'Plus Jakarta Sans',sans-serif;padding:10px 16px;border-radius:999px;box-shadow:0 6px 24px rgba(0,0,0,.2)";
    document.body.appendChild(b);
  } else if (document.visibilityState === "visible") {
    send("view");
  } else {
    document.addEventListener("visibilitychange", function on() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", on);
      send("view");
    });
  }

  // seções vistas: conta quando a seção fica ao menos 1,5 s na tela
  if ("IntersectionObserver" in window && !C.preview) {
    var timers = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var name = e.target.getAttribute("data-track");
        // seções altas no celular: vale ocupar boa parte da tela
        var seen = e.isIntersecting && (e.intersectionRatio >= 0.35 || e.intersectionRect.height >= innerHeight * 0.4);
        if (seen) {
          if (timers[name]) return;
          timers[name] = setTimeout(function () {
            io.unobserve(e.target);
            once("sec_" + name, function () { send("section", name); });
          }, 1500);
        } else {
          clearTimeout(timers[name]);
          timers[name] = 0;
        }
      });
    }, { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75] });
    $$("[data-track]").forEach(function (el) { io.observe(el); });
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
    b.addEventListener("click", function () { once("approve_open", function () { send("approve_open"); }); dlg.showModal(); setTimeout(function () { var i = dlg.querySelector("#ap-name"); if (i) i.focus(); }, 30); });
  });
})();
