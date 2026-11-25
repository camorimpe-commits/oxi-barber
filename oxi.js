// Dados, cálculos, gerador de proposta, agenda iOS (.ics) e CRM local OXI·BARBER
(function (global) {
  const DEFAULT_ALERT_PHONE = "81995362243";
  const STORAGE_KEY = "oxi_barber_crm_v1";

  const PLANOS = [
    {
      id: "avulso",
      nome: "Avulso",
      preco: 180,
      periodo: "por aplicação",
      aplicacoes: 1,
      economiaMes: 0,
      tagline: "Para testar e sentir a diferença no salão",
      itens: [
        "1 oxi-sanitização completa por plasma frio",
        "Ambiente, cadeiras, bancadas e estofados",
        "Neutralização real de odores (sem mascarar)",
        "Sem vínculo ou recorrência",
      ],
    },
    {
      id: "mensal",
      nome: "Mensal Fixo",
      preco: 390,
      periodo: "/mês",
      aplicacoes: 4,
      destaque: true,
      economiaMes: 330,
      tagline: "4x por mês · R$ 97,50 por aplicação",
      itens: [
        "4 aplicações/mês (1x por semana, dia fixo)",
        "Agenda fora do expediente (zero perda de hora)",
        "Economia de R$ 330/mês vs. 4 aplicações avulsas",
        "Selo físico \"Ambiente Oxi-Sanitizado\" + arte p/ Instagram",
        "Certificado mensal de higienização + sem fidelidade",
      ],
    },
    {
      id: "premium",
      nome: "Premium Alto Fluxo",
      preco: 690,
      periodo: "/mês",
      aplicacoes: 8,
      economiaMes: 750,
      tagline: "8x por mês · ideal para +4 cadeiras",
      itens: [
        "8 aplicações/mês (2x por semana)",
        "Inclui área de toalhas, capas, lavatórios e ar-condicionado",
        "Kit completo de marketing (selo + stories + placa de recepção)",
        "Atendimento prioritário e reposição emergencial",
      ],
    },
  ];

  const brl = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

  const brlCentavos = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  function calcularROI(opts) {
    const {
      clientesDia = 25,
      ticket = 50,
      diasMes = 26,
      cadeiras = 3,
      planoId = "mensal",
    } = opts || {};

    const plano = PLANOS.find((p) => p.id === planoId) || PLANOS[1];
    const custoMes = plano.id === "avulso" ? plano.preco * 4 : plano.preco;
    const atendMes = Math.max(1, clientesDia * diasMes);
    const faturamentoMes = atendMes * ticket;
    const porCliente = custoMes / atendMes;
    const cortesParaPagar = Math.ceil(custoMes / Math.max(1, ticket));
    const percentualFaturamento = (custoMes / Math.max(1, faturamentoMes)) * 100;
    const custoPorCadeiraDia = custoMes / (Math.max(1, cadeiras) * Math.max(1, diasMes));

    return {
      plano,
      custoMes,
      atendMes,
      faturamentoMes,
      porCliente,
      cortesParaPagar,
      percentualFaturamento,
      custoPorCadeiraDia,
    };
  }

  function montarTextoProposta(opts) {
    const {
      barbearia = "sua barbearia",
      clientesDia = 25,
      ticket = 50,
      diasMes = 26,
      cadeiras = 3,
      planoId = "mensal",
    } = opts || {};

    const nome = (barbearia || "").trim() || "sua barbearia";
    const roi = calcularROI({ clientesDia, ticket, diasMes, cadeiras, planoId });
    const aplicacoesTexto =
      roi.plano.id === "avulso"
        ? "4 aplicações avulsas no mês"
        : `${roi.plano.aplicacoes} aplicações fixas no mês`;

    return [
      `Olá! Preparei a simulação de Oxi-Sanitização com Ozônio (tecnologia Plasma Frio) para a *${nome}*:`,
      "",
      `• Estrutura considerada: ${cadeiras} cadeira(s) · ~${clientesDia} clientes/dia (${roi.atendMes} atendimentos/mês)`,
      `• Plano recomendado: *${roi.plano.nome}* (${aplicacoesTexto})`,
      `• Investimento mensal: *${brl.format(roi.custoMes)}*`,
      `• Custo real por atendimento: *${brlCentavos.format(roi.porCliente)}* por cliente`,
      `• Ponto de equilíbrio: o mês inteiro se paga com apenas *${roi.cortesParaPagar} corte(s)* (ticket de ${brl.format(ticket)})`,
      "",
      "Benefícios inclusos:",
      "- Aplicação fora do expediente (não para a barbearia)",
      "- Eliminação de fungos, bactérias, vírus e odores sem químicos ou resíduos",
      "- Selo \"Ambiente Oxi-Sanitizado\" + material para divulgar no Instagram",
      "",
      "Podemos agendar uma aplicação demonstrativa ou já reservar seu dia fixo na semana?",
    ].join("\n");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function sanitizePhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    return digits.startsWith("55") && digits.length >= 12 ? digits : `55${digits}`;
  }

  function formatPhoneDisplay(phone) {
    const d = String(phone || "").replace(/\D/g, "").replace(/^55/, "");
    if (d.length === 11) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    }
    if (d.length === 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    }
    return phone || "";
  }

  function toIcsUtc(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  function toIcsLocal(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
      date.getFullYear() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      "00"
    );
  }

  function escapeIcs(text) {
    return String(text || "")
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  }

  function buildEventDates(dataStr, horaStr) {
    const [y, m, d] = (dataStr || "").split("-").map(Number);
    const [hh, mm] = (horaStr || "20:00").split(":").map(Number);
    const start = y && m && d ? new Date(y, m - 1, d, hh || 20, mm || 0, 0) : new Date();
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    return { start, end };
  }

  function gerarICS(item) {
    const plano = PLANOS.find((p) => p.id === item.planoId) || PLANOS[1];
    const { start, end } = buildEventDates(item.proximaData, item.horario);
    const nowUtc = toIcsUtc(new Date());
    const dtStart = toIcsUtc(start);
    const dtEnd = toIcsUtc(end);

    const summary = `Oxi-Sanitização · ${item.nome} (${plano.nome})`;
    const desc = [
      `Barbearia: ${item.nome}`,
      `Responsável: ${item.responsavel || "-"}`,
      `WhatsApp barbearia: ${item.whatsapp || "-"}`,
      `Plano: ${plano.nome} (${brl.format(plano.preco)}${plano.periodo})`,
      `Estrutura: ${item.cadeiras || 3} cadeiras · ${item.metragem || 40} m²`,
      `Checklist: Ambiente vazio (sem pessoas/animais/plantas) -> Ciclo Plasma Frio -> Ventilação O3 -> O2.`,
      item.observacoes ? `Obs: ${item.observacoes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//OXI-BARBER//Agenda Oxi-Sanitizacao//PT-BR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:oxi-${item.id || Date.now()}@oxibarber.local`,
      `DTSTAMP:${nowUtc}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `LOCATION:${escapeIcs(item.endereco || "Barbearia cadastrada")}`,
      `DESCRIPTION:${escapeIcs(desc)}`,
    ];

    if (item.planoId === "mensal") {
      lines.push("RRULE:FREQ=WEEKLY;INTERVAL=1");
    } else if (item.planoId === "premium") {
      lines.push("RRULE:FREQ=WEEKLY;INTERVAL=1");
    }

    lines.push(
      "BEGIN:VALARM",
      "TRIGGER:-PT60M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(`Em 1h: Oxi-Sanitização na ${item.nome}`)}`,
      "END:VALARM",
      "BEGIN:VALARM",
      "TRIGGER:-PT15M",
      "ACTION:DISPLAY",
      `DESCRIPTION:${escapeIcs(`Em 15min: Oxi-Sanitização na ${item.nome}`)}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    );

    return lines.join("\r\n");
  }

  function gerarGoogleAgendaUrl(item) {
    const plano = PLANOS.find((p) => p.id === item.planoId) || PLANOS[1];
    const { start, end } = buildEventDates(item.proximaData, item.horario);
    const dates = `${toIcsLocal(start)}/${toIcsLocal(end)}`;
    const details = [
      `Plano: ${plano.nome} (${brl.format(plano.preco)}${plano.periodo})`,
      `Responsável: ${item.responsavel || "-"} | WhatsApp: ${item.whatsapp || "-"}`,
      `Estrutura: ${item.cadeiras || 3} cadeiras · ${item.metragem || 40} m²`,
      item.observacoes ? `Obs: ${item.observacoes}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Oxi-Sanitização · ${item.nome}`,
      dates,
      location: item.endereco || "",
      details,
    });
    if (item.planoId === "mensal" || item.planoId === "premium") {
      params.set("recur", "RRULE:FREQ=WEEKLY");
    }
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  function gerarLinkAlertaWhatsApp(item, phoneDestino) {
    const plano = PLANOS.find((p) => p.id === item.planoId) || PLANOS[1];
    const fullPhone = sanitizePhone(phoneDestino || DEFAULT_ALERT_PHONE);
    const dataFmt = item.proximaData
      ? item.proximaData.split("-").reverse().join("/")
      : "a definir";
    const msg = [
      `🔔 *LEMBRETE OXI·BARBER*`,
      ``,
      `🏪 *Barbearia:* ${item.nome}`,
      `👤 *Responsável:* ${item.responsavel || "Não informado"}`,
      `📍 *Endereço:* ${item.endereco || "Não informado"}`,
      `📅 *Data / Hora:* ${dataFmt} às ${item.horario || "20:00"} (${item.diaSemana || "Fixo"})`,
      `💎 *Plano:* ${plano.nome} (${brl.format(plano.preco)}${plano.periodo})`,
      `🪑 *Estrutura:* ${item.cadeiras || 3} cadeiras · ${item.metragem || 40} m²`,
      item.observacoes ? `📝 *Obs:* ${item.observacoes}` : "",
      ``,
      `✅ Checklist: confirmar ambiente vazio (sem pessoas/animais/plantas), aplicar ciclo por m² e aguardar ventilação.`,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  }

  function loadCRM() {
    try {
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {
          alertPhone: DEFAULT_ALERT_PHONE,
          webhookUrl: "",
          items: [],
        };
      }
      const parsed = JSON.parse(raw);
      return {
        alertPhone: parsed.alertPhone || DEFAULT_ALERT_PHONE,
        webhookUrl: parsed.webhookUrl || "",
        items: Array.isArray(parsed.items) ? parsed.items : [],
      };
    } catch {
      return {
        alertPhone: DEFAULT_ALERT_PHONE,
        webhookUrl: "",
        items: [],
      };
    }
  }

  function saveCRM(data) {
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  global.OXI_BARBER = {
    DEFAULT_ALERT_PHONE,
    PLANOS,
    brl,
    brlCentavos,
    calcularROI,
    montarTextoProposta,
    escapeHtml,
    sanitizePhone,
    formatPhoneDisplay,
    gerarICS,
    gerarGoogleAgendaUrl,
    gerarLinkAlertaWhatsApp,
    loadCRM,
    saveCRM,
  };
})(window);
