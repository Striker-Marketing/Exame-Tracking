(function () {
  const computeFaixa = (formData) => {
    const { nascimento, situacao, cargo, renda, escolaridade } = formData || {};
    let hasLead = false;

    if (escolaridade === "Até ensino médio completo") return "Inelegível";
    if (!escolaridade && !cargo && !renda && !nascimento && !situacao) return "Sem_Score";

    const escolaridadePts = { "Pós-graduação/MBA": 18, Mestrado: 12, Doutorado: 12, "Ensino superior completo": 12 }[escolaridade] || 0;
    const cargoPts = { Gerente: 22, Diretor: 22, "VP ou C-Level": 20, "Sócio ou Fundador": 20, "Coordenador ou Supervisor": 17, Analista: 13, Outro: 11 }[cargo] || 0;
    const rendaPts = { "+R$12.000,00": 35, "R$8.000,00 - R$12.000,00": 23, "R$5.000,00 - R$8.000,00": 17, "Sem renda": 17, "R$2.000,00 - R$5.000,00": 12, "Até R$2.000,00": 11 }[renda] || 0;

    let idade = null;
    if (nascimento) {
      const dob = new Date(nascimento);
      if (!isNaN(dob)) {
        const today = new Date();
        idade = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) idade--;
      }
    }
    let idadePts = 0;
    if (idade !== null) {
      if (idade > 50) idadePts = 21;
      else if (idade >= 30) idadePts = 16;
      else if (idade >= 25) idadePts = 10;
      else idadePts = 8;
    }

    const situacaoPts = ["Empreendedor", "Aposentado", "Funcionário Público", "Funcionário Privado"].includes(situacao) ? 4 : situacao === "Desempregado" ? 3 : 2;

    const highRenda = renda === "+R$12.000,00";
    const seniorCargo = ["Gerente", "Diretor", "VP ou C-Level", "Sócio ou Fundador"].includes(cargo);
    let bonusPts = 0;
    if (renda && cargo && idade !== null) {
      if (highRenda && ["Gerente", "Sócio ou Fundador"].includes(cargo) && idade > 50) bonusPts = 15;
      else if (highRenda && ["VP ou C-Level", "Diretor"].includes(cargo) && idade > 50) bonusPts = 12;
      else if (highRenda && cargo === "Gerente" && idade >= 36 && idade <= 50) bonusPts = 8;
      else if (highRenda && idade > 50) bonusPts = 10;
      else if (seniorCargo && idade > 50) bonusPts = 8;
      else if (highRenda && seniorCargo) bonusPts = 6;
    }

    const score = Math.min(escolaridadePts + cargoPts + rendaPts + idadePts + situacaoPts + bonusPts, 100);
    if (score >= 95) return "Quente";
    if (score >= 77) return "Morno";
    if (score >= 66) return "Frio";
    return "Desqualificado";
  };

  const extractFormData = (form) => {
    const data = {};
    const fields = ["nascimento", "situacao", "cargo", "renda", "escolaridade"];
    const fd = new FormData(form);
    fields.forEach((name) => {
      const value = fd.get(name);
      if (value != null) data[name] = String(value).trim();
    });
    return data;
  };

  const handleSubmit = (event) => {
    if (hasLead) return;
    const form = event.target;
    if (!form || form.tagName !== "FORM") return;
    const formData = extractFormData(form);
    const faixa = computeFaixa(formData);
    console.log("[trackQualifiedLead] faixa:", faixa);
    if (["Quente", "Morno", "Frio"].includes(faixa) && window.umami) {
      window.umami.track("Qualified Lead");
      hasLead = true;
    }
  };

  document.addEventListener("submit", handleSubmit);
})();
