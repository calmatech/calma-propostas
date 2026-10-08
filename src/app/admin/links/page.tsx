import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { publicUrl, shortLink, timeAgo } from "@/lib/proposals";
import { Copy } from "@/components/copy";
import { ActionButton } from "@/components/action-button";
import { deleteLink } from "../actions";
import { NewLinkForm } from "./form";

type LinkRow = {
  code: string;
  target_url: string | null;
  label: string;
  clicks: number;
  last_click_at: string | null;
  created_at: string;
  proposal: { id: string; slug: string; client_name: string } | null;
};

export default async function LinksPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("links")
    .select("*, proposal:proposals(id, slug, client_name)")
    .order("created_at", { ascending: false });
  const links = (data ?? []) as LinkRow[];

  return (
    <>
      <div className="head">
        <div>
          <h1>Links curtos</h1>
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Cada proposta ganha um link automaticamente. Aqui você também cria links avulsos.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <NewLinkForm />
      </div>

      {error && <p className="err">Erro ao carregar: {error.message}</p>}

      <div className="tablewrap">
        <table className="table">
          <thead>
            <tr>
              <th>Link</th>
              <th>Destino</th>
              <th>Cliques</th>
              <th className="hide-sm">Último clique</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {links.map((l) => (
              <tr key={l.code}>
                <td>
                  <Copy text={shortLink(l.code)} />
                  {l.label && <div className="muted small" style={{ marginTop: 4 }}>{l.label}</div>}
                </td>
                <td style={{ maxWidth: 340, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.proposal ? (
                    <Link href={`/admin/propostas/${l.proposal.id}`}>Proposta · {l.proposal.client_name}</Link>
                  ) : (
                    <a href={l.target_url ?? "#"} target="_blank" rel="noreferrer" className="muted">
                      {l.target_url}
                    </a>
                  )}
                  {l.proposal && <div className="muted small">{publicUrl(l.proposal.slug).replace(/^https?:\/\//, "")}</div>}
                </td>
                <td>{l.clicks}</td>
                <td className="hide-sm muted">{timeAgo(l.last_click_at)}</td>
                <td style={{ textAlign: "right" }}>
                  <ActionButton action={deleteLink.bind(null, l.code)} confirm={`Excluir o link ${l.code}? Quem tiver esse link vai cair no site do estúdio.`} className="linkbtn small">
                    Excluir
                  </ActionButton>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={5} className="muted">
                  Nenhum link ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
