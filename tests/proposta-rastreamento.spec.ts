import { test, expect, type Page } from "@playwright/test";

type Evento = { type: string; detail: string };

// Captura os avisos enviados para /api/track (sem gravar no banco) e qualquer erro de JavaScript da página.
async function abrir(page: Page, query = "") {
  const eventos: Evento[] = [];
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.route("**/api/track", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}");
    eventos.push({ type: body.type, detail: body.detail ?? "" });
    await route.fulfill({ status: 204 });
  });
  await page.goto(`/dev/proposta${query}`);
  await page.waitForLoadState("load");
  return { eventos, erros };
}

// Rola a página aos poucos, como uma pessoa lendo (cada seção precisa de 1,5 s na tela)
async function rolarAteOFim(page: Page) {
  const altura = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < altura; y += 250) {
    await page.evaluate(() => window.scrollBy(0, 250));
    await page.waitForTimeout(600);
  }
  await page.waitForTimeout(2500);
}

const secoes = (ev: Evento[]) => ev.filter((e) => e.type === "section").map((e) => e.detail);

test("registra abertura, todas as seções, o investimento e o clique em Aprovar", async ({ page }) => {
  const { eventos, erros } = await abrir(page);
  await rolarAteOFim(page);

  await page.locator("[data-approve]").click();
  await expect(page.locator("dialog.ap-dlg")).toBeVisible();
  await page.locator("dialog.ap-dlg [data-close]").click();
  await page.waitForTimeout(800);

  expect(erros, "a página não pode ter erros de JavaScript").toEqual([]);
  expect(eventos.filter((e) => e.type === "view")).toHaveLength(1);
  const esperadas = await page.$$eval("[data-track]", (els) => els.map((el) => el.getAttribute("data-track")));
  expect(new Set(secoes(eventos))).toEqual(new Set(esperadas));
  expect(secoes(eventos)).toContain("investimento");
  expect(eventos.filter((e) => e.type === "approve_open")).toHaveLength(1);
});

test("sem a seção Calma Cloud: continua rastreando e sem erros", async ({ page }) => {
  const { eventos, erros } = await abrir(page, "?semCloud=1");
  await rolarAteOFim(page);
  expect(erros).toEqual([]);
  expect(await page.locator("#cloud").count()).toBe(0);
  expect(secoes(eventos)).toContain("investimento");
  expect(secoes(eventos)).not.toContain("cloud");
});

test("com cases: grupos, site ao vivo, ver mais, ampliar imagem e rastreamento", async ({ page }) => {
  const { eventos, erros } = await abrir(page, "?cases=1&umaEntrega=1&etapas=3");
  await expect(page.locator(".cgroup")).toHaveCount(2);
  await expect(page.locator(".cproj[hidden]")).toHaveCount(1); // Apps: 3 projetos, 2 abertos
  await rolarAteOFim(page);
  expect(erros).toEqual([]);
  expect(secoes(eventos)).toContain("cases");
  // o quadro de link vira um site ao vivo ao chegar perto da tela
  await expect(page.locator(".cframe iframe").first()).toHaveAttribute("src", /^https?:\/\//);
  // "Ver mais" (Apps) mostra o projeto oculto; o de Websites é um link
  await page.locator("[data-more]").click();
  await expect(page.locator(".cproj[hidden]")).toHaveCount(0);
  await expect(page.locator("a.cmore")).toHaveAttribute("href", /estudiocalma/);
  // imagem: clique abre a galeria do projeto (2 quadros + fotos extras), na foto clicada
  const quadro = page.locator(".cproj", { hasText: "Lab Comportamental" }).locator("button.cframe").nth(1);
  await quadro.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const y = await page.evaluate(() => scrollY);
  await quadro.click();
  const g = page.locator("dialog.gallery");
  await expect(g).toBeVisible();
  await expect(g.locator(".g-count")).toHaveText("2 / 4");
  await expect(page.locator("html")).toHaveClass(/g-lock/); // proposta não rola por trás
  await page.keyboard.press("ArrowRight");
  await expect(g.locator(".g-count")).toHaveText("3 / 4");
  // arrastar para a esquerda avança
  const box = (await g.locator(".g-stage").boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect(g.locator(".g-count")).toHaveText("4 / 4");
  await page.locator("[data-g-close]").click();
  await expect(g).toBeHidden();
  await expect(page.locator("html")).not.toHaveClass(/g-lock/);
  const yDepois = await page.evaluate(() => scrollY);
  expect(Math.abs(yDepois - y), `rolagem antes ${y}, depois ${yDepois}`).toBeLessThan(5); // volta ao mesmo ponto
  expect(erros).toEqual([]);
});

test("visita da equipe (pré-visualização) não envia nada", async ({ page }) => {
  const { eventos, erros } = await abrir(page, "?equipe=1");
  await rolarAteOFim(page);
  expect(erros).toEqual([]);
  expect(eventos).toEqual([]);
  await expect(page.locator(".cp-bar")).toBeVisible();
});
