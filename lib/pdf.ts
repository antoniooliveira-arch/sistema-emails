import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { EmailInstitucional, Situacao } from "@/lib/types";
import { situacoes } from "@/lib/types";

const CORES: Record<Situacao, string> = {
  em_uso: "#16a34a",
  em_uso_atualizar_responsavel: "#d97706",
  nao_utilizado: "#dc2626",
  desativado: "#6b7280",
  nao_localizado: "#2563eb",
};

const ROTULOS: Record<Situacao, string> = {
  em_uso: "Em uso",
  em_uso_atualizar_responsavel: "Em uso, atualizar resp.",
  nao_utilizado: "Não utilizado",
  desativado: "Desativar",
  nao_localizado: "Não localizado",
};

const NAVY: [number, number, number] = [30, 58, 138];
const AZUL: [number, number, number] = [37, 99, 235];
const ZINCO: [number, number, number] = [55, 65, 81];
const CLARO: [number, number, number] = [239, 246, 255];

function hexToRgb(hex: string): [number, number, number] {
  const v = hex.replace("#", "");
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function novoCanvas(wPt: number, hPt: number, escala = 3) {
  const canvas = document.createElement("canvas");
  canvas.width = wPt * escala;
  canvas.height = hPt * escala;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não suportado");
  ctx.scale(escala, escala);
  ctx.textBaseline = "middle";
  return { canvas, ctx };
}

function donutDataUrl(dados: { rotulo: string; valor: number; cor: string }[], wPt: number, hPt: number) {
  const { canvas, ctx } = novoCanvas(wPt, hPt);
  const cx = wPt / 2;
  const cy = hPt / 2;
  const r = Math.min(wPt, hPt) / 2 - 8;
  const buraco = r * 0.62;
  const total = dados.reduce((s, d) => s + d.valor, 0) || 1;

  let ang = -Math.PI / 2;
  for (const d of dados) {
    if (!d.valor) continue;
    const a = (d.valor / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, ang, ang + a);
    ctx.closePath();
    ctx.fillStyle = d.cor;
    ctx.fill();
    ang += a;
  }

  ctx.beginPath();
  ctx.arc(cx, cy, buraco, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#1e293b";
  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(String(total), cx, cy - 6);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "11px sans-serif";
  ctx.fillText("e-mails", cx, cy + 16);

  return canvas.toDataURL("image/png");
}

function barrasDataUrl(
  itens: { nome: string; total: number; encaminhados: number }[],
  wPt: number,
  hPt: number
) {
  const { canvas, ctx } = novoCanvas(wPt, hPt);
  const margemSup = 14;
  const margemEsq = 150;
  const margemDir = 46;
  const maxV = Math.max(...itens.map((i) => i.total), 1);
  const disponivel = itens.length ? hPt - margemSup : hPt;
  const alturaLinha = Math.max(30, disponivel / itens.length || disponivel);

  itens.forEach((it, i) => {
    const y = margemSup + i * alturaLinha + alturaLinha * 0.25;
    const alturaBarra = Math.min(30, alturaLinha * 0.5);

    ctx.fillStyle = "#334155";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(it.nome.length > 32 ? it.nome.slice(0, 31) + "…" : it.nome, 6, y + alturaBarra / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(String(it.total), margemEsq - 10, y + alturaBarra / 2);

    const largMax = wPt - margemEsq - margemDir;
    const wTotal = (it.total / maxV) * largMax;
    const wEnc = (it.encaminhados / maxV) * largMax;

    ctx.fillStyle = "#e2e8f0";
    buscaRounded(ctx, margemEsq, y, Math.max(wTotal, 2), alturaBarra, 6);
    ctx.fill();
    ctx.fillStyle = "#2563eb";
    buscaRounded(ctx, margemEsq, y, Math.max(wEnc, 2), alturaBarra, 6);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${it.encaminhados}/${it.total}`, margemEsq + wTotal + 6, y + alturaBarra / 2);
  });

  return canvas.toDataURL("image/png");
}

function buscaRounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const raio = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + raio, y);
  ctx.arcTo(x + w, y, x + w, y + h, raio);
  ctx.arcTo(x + w, y + h, x, y + h, raio);
  ctx.arcTo(x, y + h, x, y, raio);
  ctx.arcTo(x, y, x + w, y, raio);
  ctx.closePath();
}

function boxResumo(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  titulo: string,
  valor: number,
  cor: [number, number, number],
  fundo: [number, number, number]
) {
  doc.setFillColor(...fundo);
  doc.setDrawColor(220, 226, 235);
  doc.roundedRect(x, y, w, h, 6, 6, "FD");
  doc.setTextColor(...cor);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(titulo.toUpperCase(), x + 10, y + 6, { baseline: "top" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.text(String(valor), x + 10, y + h / 2 + 4);
}

export function gerarRelatorioPdf(emails: EmailInstitucional[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const LARG = doc.internal.pageSize.getWidth();
  const ALT = doc.internal.pageSize.getHeight();
  const MARGEM = 40;

  const agora = new Date();
  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const contagem = new Map<Situacao, number>();
  for (const s of situacoes) contagem.set(s.value, 0);
  emails.forEach((e) => contagem.set(e.situacao, (contagem.get(e.situacao) ?? 0) + 1));

  const porSecretaria = new Map<string, { total: number; encaminhados: number }>();
  emails.forEach((e) => {
    const at = porSecretaria.get(e.secretaria) ?? { total: 0, encaminhados: 0 };
    at.total += 1;
    if (e.encaminhado) at.encaminhados += 1;
    porSecretaria.set(e.secretaria, at);
  });

  const total = emails.length;
  const encaminhados = emails.filter((e) => e.encaminhado).length;
  const pendentes = total - encaminhados;

  // Cabeçalho
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, LARG, 108, "F");
  doc.setFillColor(...AZUL);
  doc.rect(0, 108, LARG, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  doc.text("Relatório de E-mails Institucionais", MARGEM, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text("Prefeitura Municipal de Juína/MT – Controle de e-mails por secretaria", MARGEM, 62);
  doc.setFontSize(9);
  doc.setTextColor(196, 210, 245);
  doc.text(`Gerado em ${dataExtenso} às ${hora} · ${total} registro(s)`, MARGEM, 82);

  // Resumo
  const cw = (LARG - MARGEM * 2 - 20) / 3;
  boxResumo(doc, MARGEM, 132, cw, 62, "Total de e-mails", total, NAVY, CLARO);
  boxResumo(
    doc,
    MARGEM + cw + 10,
    132,
    cw,
    62,
    "Formulários encaminhados",
    encaminhados,
    [22, 101, 52],
    [236, 253, 245]
  );
  boxResumo(
    doc,
    MARGEM + (cw + 10) * 2,
    132,
    cw,
    62,
    "Pendentes de preenchimento",
    pendentes,
    [180, 83, 9],
    [254, 249, 230]
  );

  // Gráfico 1: donut de situações
  let y = 224;
  doc.setTextColor(...ZINCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("Situação dos e-mails", MARGEM, y);
  doc.setDrawColor(226, 232, 240);
  doc.line(MARGEM, y + 8, LARG - MARGEM, y + 8);

  const dadosDonut = situacoes
    .map((s) => ({ rotulo: ROTULOS[s.value], valor: contagem.get(s.value) ?? 0, cor: CORES[s.value] }))
    .filter((d) => d.valor > 0);

  const donutDados = donutDataUrl(dadosDonut, 190, 190);
  const graficoY = y + 24;
  doc.addImage(donutDados, "PNG", MARGEM, graficoY, 190, 190);

  const legendX = MARGEM + 220;
  let ly = graficoY + 8;
  doc.setFontSize(10);
  for (const d of dadosDonut) {
    doc.setFillColor(...hexToRgb(d.cor));
    doc.roundedRect(legendX, ly - 6, 10, 10, 2, 2, "F");
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "normal");
    doc.text(d.rotulo, legendX + 18, ly);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...AZUL);
    doc.text(String(d.valor), LARG - MARGEM - 54, ly);
    ly += 24;
  }

  // Gráfico 2: barras por secretaria
  y = graficoY + 218;
  doc.setTextColor(...ZINCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("Preenchimento por secretaria", MARGEM, y);
  doc.line(MARGEM, y + 8, LARG - MARGEM, y + 8);

  const itensBarras = [...porSecretaria.entries()]
    .map(([nome, v]) => ({ nome, total: v.total, encaminhados: v.encaminhados }))
    .sort((a, b) => b.total - a.total);
  const hBarras = Math.max(90, itensBarras.length * 30 + 14);
  const bDados = barrasDataUrl(itensBarras, LARG - MARGEM * 2, hBarras);
  const yBarras = y + 24;
  doc.addImage(bDados, "PNG", MARGEM, yBarras, LARG - MARGEM * 2, hBarras);

  // Tabela detalhada
  const tabelaY = yBarras + hBarras + 26;
  const colunas = [
    "Secretaria",
    "E-mail",
    "Setor",
    "Responsável",
    "Cargo",
    "Situação",
    "Enc.",
    "Observações",
    "Atualizado em",
  ];

  doc.setTextColor(...ZINCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("Detalhamento dos e-mails", MARGEM, tabelaY);

  autoTable(doc, {
    startY: tabelaY + 10,
    margin: { left: MARGEM, right: MARGEM },
    head: [[...colunas]],
    body: emails.map((e) => [
      e.secretaria,
      e.email,
      e.setor ?? "—",
      e.responsavel ?? "—",
      e.cargo ?? "—",
      ROTULOS[e.situacao] ?? e.situacao,
      e.encaminhado ? "✓ Sim" : "— Não",
      e.observacao ?? "—",
      e.atualizado_em ? new Date(e.atualizado_em).toLocaleString("pt-BR") : "—",
    ]),
    styles: { fontSize: 7.5, cellPadding: 2.6, valign: "middle", textColor: [51, 65, 85] },
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    columnStyles: {
      0: { cellWidth: 58, fontStyle: "bold" },
      1: { cellWidth: 108 },
      2: { cellWidth: 62 },
      3: { cellWidth: 66 },
      4: { cellWidth: 52 },
      5: { cellWidth: 68 },
      6: { cellWidth: 26 },
      7: { cellWidth: 88 },
      8: { cellWidth: 62 },
    },
    didParseCell: (data) => {
      if (data.section === "body" && data.column.index === 5) {
        const situacao = emails[data.row.index]?.situacao;
        if (situacao) {
          data.cell.styles.textColor = hexToRgb(CORES[situacao]);
          data.cell.styles.fontStyle = "bold";
        }
      }
      if (data.section === "body" && data.column.index === 6) {
        const enc = emails[data.row.index]?.encaminhado;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.textColor = enc ? hexToRgb("#16a34a") : hexToRgb("#94a3b8");
      }
    },
  });

  const paginaFinal =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? ALT;
  void paginaFinal;

  // Rodapé + numeração
  const nPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= nPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(MARGEM, ALT - 46, LARG - MARGEM, ALT - 46);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text("Prefeitura Municipal de Juína/MT – Sistema de Controle de E-mails Institucionais", MARGEM, ALT - 32);
    doc.text(`Página ${i} de ${nPaginas}`, LARG - MARGEM, ALT - 32, { align: "right" });
  }

  doc.save(`relatorio-emails-institucionais-${agora.toISOString().slice(0, 10)}.pdf`);
  void paginaFinal;
}