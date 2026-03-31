const STORAGE_KEYS = {
  cadastro: 'sec_cadastro',
  perfil: 'sec_perfil',
  medicoes: 'sec_medicoes'
};

let glicemiaChart = null;
let pressaoChart = null;
let fcChart = null;
let saturacaoChart = null;
let pesoChart = null;
let temperaturaChart = null;

function goToScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  const tela = document.getElementById(id);
  if (!tela) {
    console.error('Tela não encontrada:', id);
    return;
  }

  tela.classList.add('active');

  if (id === 'dashboardScreen') {
    renderDashboard();
  }

  if (id === 'printScreen') {
    renderPrintScreen();
  }
}

function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getData(key, fallback = null) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

function showMessage(targetId, text, isError = false) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerHTML = `<div class="message ${isError ? 'error' : 'success'}">${text}</div>`;
}

function cadastroHandler(e) {
  e.preventDefault();

  const nome = document.getElementById('cadNome').value.trim();
  const email = document.getElementById('cadEmail').value.trim();
  const celular = document.getElementById('cadCelular').value.trim();
  const senha = document.getElementById('cadSenha').value.trim();
  const termos = document.getElementById('cadTermos').checked;

  if (!termos) {
    showMessage('cadastroMsg', 'Você precisa aceitar os Termos de Uso e Políticas de Privacidade.', true);
    return;
  }

  const cadastro = {
    nome: nome || 'teste',
    email: email || 'teste@teste.com',
    celular: celular || '',
    senha: senha || 'teste'
  };

  saveData(STORAGE_KEYS.cadastro, cadastro);

  showMessage('cadastroMsg', 'Cadastro concluído com sucesso. Agora faça login.');

  setTimeout(() => {
    goToScreen('loginScreen');
  }, 900);
}

function loginHandler(e) {
  e.preventDefault();

  const emailDigitado = document.getElementById('loginEmail').value.trim().toLowerCase();
  const senhaDigitada = document.getElementById('loginSenha').value.trim();

  const cadastro = getData(STORAGE_KEYS.cadastro, {
    nome: 'teste',
    email: 'teste@teste.com',
    senha: 'teste'
  });

  const emailSalvo = (cadastro.email || 'teste@teste.com').toLowerCase();
  const nomeSalvo = (cadastro.nome || 'teste').toLowerCase();
  const senhaSalva = cadastro.senha || 'teste';

  const emailValido = (emailDigitado === emailSalvo || emailDigitado === nomeSalvo);
  const senhaValida = (senhaDigitada === senhaSalva);

  if (!emailValido || !senhaValida) {
    showMessage('loginMsg', 'Login inválido. Use o login e senha cadastrados.', true);
    return;
  }

  showMessage('loginMsg', 'Login realizado com sucesso.');

  setTimeout(() => {
    preencherPerfilComCadastro();
    goToScreen('menuScreen');
  }, 700);
}

function preencherPerfilComCadastro() {
  const cadastro = getData(STORAGE_KEYS.cadastro, {});
  const perfilNome = document.getElementById('perfilNome');
  if (perfilNome) {
    perfilNome.value = cadastro.nome || 'teste';
  }
}

function loginUpdateHandler(e) {
  e.preventDefault();

  const novoLogin = document.getElementById('novoLogin').value.trim();
  const novaSenha = document.getElementById('novaSenha').value.trim();

  const cadastroAtual = getData(STORAGE_KEYS.cadastro, {});

  const cadastroAtualizado = {
    ...cadastroAtual,
    email: novoLogin || cadastroAtual.email || 'teste@teste.com',
    senha: novaSenha || cadastroAtual.senha || 'teste'
  };

  saveData(STORAGE_KEYS.cadastro, cadastroAtualizado);
  showMessage('loginUpdateMsg', 'Login e senha atualizados com sucesso.');
}

function perfilHandler(e) {
  e.preventDefault();

  const perfil = {
    nome: document.getElementById('perfilNome').value.trim(),
    nascimento: document.getElementById('perfilNascimento').value,
    sexo: document.getElementById('perfilSexo').value,
    altura: document.getElementById('perfilAltura').value,
    pesoBase: document.getElementById('perfilPesoBase').value,
    abdominal: document.getElementById('perfilAbdominal').value,
    diabetes: document.getElementById('perfilDiabetes').value,
    hipertensao: document.getElementById('perfilHipertensao').value,
    fuma: document.getElementById('perfilFuma').value,
    alcool: document.getElementById('perfilAlcool').value,
    observacoes: document.getElementById('perfilObs').value.trim()
  };

  saveData(STORAGE_KEYS.perfil, perfil);
  showMessage('perfilMsg', 'Perfil salvo com sucesso.');

  setTimeout(() => {
    setTodayDefault();
    goToScreen('medicaoScreen');
  }, 700);
}

function setTodayDefault() {
  const hoje = new Date().toISOString().split('T')[0];
  const agora = new Date();
  const hh = String(agora.getHours()).padStart(2, '0');
  const mm = String(agora.getMinutes()).padStart(2, '0');

  const medData = document.getElementById('medData');
  const medHorario = document.getElementById('medHorario');

  if (medData) medData.value = hoje;
  if (medHorario) medHorario.value = `${hh}:${mm}`;
}

function medicaoHandler(e) {
  e.preventDefault();

  const medicao = {
    data: document.getElementById('medData').value,
    horario: document.getElementById('medHorario').value,
    sistolica: document.getElementById('medSistolica').value,
    diastolica: document.getElementById('medDiastolica').value,
    glicemia: document.getElementById('medGlicemia').value,
    frequencia: document.getElementById('medFc').value,
    saturacao: document.getElementById('medSaturacao').value,
    peso: document.getElementById('medPeso').value,
    temperatura: document.getElementById('medTemperatura').value,
    observacoes: document.getElementById('medObs').value.trim()
  };

  const medicoes = getData(STORAGE_KEYS.medicoes, []);
  medicoes.push(medicao);
  saveData(STORAGE_KEYS.medicoes, medicoes);

  showMessage('medicaoMsg', 'Medição salva com sucesso.');

  setTimeout(() => {
    goToScreen('dashboardScreen');
  }, 700);
}

function classificarPressao(s, d) {
  const sis = Number(s);
  const dia = Number(d);

  if (!sis || !dia) return '-';
  if (sis >= 180 || dia >= 120) return 'Crise hipertensiva';
  if (sis >= 140 || dia >= 90) return 'Hipertensão';
  if (sis >= 120 || dia >= 80) return 'Pressão elevada';
  return 'Normal';
}

function classificarGlicemia(g) {
  const val = Number(g);

  if (!val) return '-';
  if (val >= 126) return 'Elevada';
  if (val >= 100) return 'Alterada';
  return 'Normal';
}

function renderDashboard() {
  const perfil = getData(STORAGE_KEYS.perfil, {});
  const medicoes = getData(STORAGE_KEYS.medicoes, []);
  const ultima = medicoes.length ? medicoes[medicoes.length - 1] : null;

  const healthCards = document.getElementById('healthCards');
  if (healthCards) {
    healthCards.innerHTML = `
      <div class="health-mini-card card-peach">
        <h4>Altura</h4>
        <div class="value">${perfil.altura ? perfil.altura + ' cm' : '--'}</div>
        <div class="sub">Altura cadastrada</div>
      </div>

      <div class="health-mini-card card-peach">
        <h4>Peso</h4>
        <div class="value">${ultima && ultima.peso ? ultima.peso + ' kg' : '--'}</div>
        <div class="sub">Último valor registrado</div>
      </div>

      <div class="health-mini-card card-lilac">
        <h4>Pressão arterial</h4>
        <div class="value">${ultima ? `${ultima.sistolica || '--'}/${ultima.diastolica || '--'}` : '--'}</div>
        <div class="sub">${ultima ? classificarPressao(ultima.sistolica, ultima.diastolica) : 'Sem dados'}</div>
      </div>

      <div class="health-mini-card card-pink">
        <h4>Glicose</h4>
        <div class="value">${ultima && ultima.glicemia ? ultima.glicemia : '--'}</div>
        <div class="sub">mg/dL</div>
      </div>

      <div class="health-mini-card card-blue">
        <h4>Frequência cardíaca</h4>
        <div class="value">${ultima && ultima.frequencia ? ultima.frequencia : '--'}</div>
        <div class="sub">bpm</div>
      </div>

      <div class="health-mini-card card-blue">
        <h4>Oximetria</h4>
        <div class="value">${ultima && ultima.saturacao ? ultima.saturacao : '--'}</div>
        <div class="sub">%</div>
      </div>

      <div class="health-mini-card card-blue">
        <h4>Temperatura</h4>
        <div class="value">${ultima && ultima.temperatura ? ultima.temperatura : '--'}</div>
        <div class="sub">°C</div>
      </div>
    `;
  }

  document.getElementById('dashboardPerfil').innerHTML = `
    <div class="summary-box"><strong>Nome:</strong> ${perfil.nome || '-'}</div>
    <div class="summary-box"><strong>Data de nascimento:</strong> ${perfil.nascimento || '-'}</div>
    <div class="summary-box"><strong>Sexo:</strong> ${perfil.sexo || '-'}</div>
    <div class="summary-box"><strong>Altura:</strong> ${perfil.altura ? perfil.altura + ' cm' : '-'}</div>
    <div class="summary-box"><strong>Peso base:</strong> ${perfil.pesoBase ? perfil.pesoBase + ' kg' : '-'}</div>
    <div class="summary-box"><strong>Circ. abdominal:</strong> ${perfil.abdominal ? perfil.abdominal + ' cm' : '-'}</div>
    <div class="summary-box"><strong>Diabetes:</strong> ${perfil.diabetes || '-'}</div>
    <div class="summary-box"><strong>Hipertensão:</strong> ${perfil.hipertensao || '-'}</div>
    <div class="summary-box"><strong>Fuma:</strong> ${perfil.fuma || '-'}</div>
    <div class="summary-box"><strong>Álcool:</strong> ${perfil.alcool || '-'}</div>
    <div class="summary-box"><strong>Observações:</strong> ${perfil.observacoes || '-'}</div>
  `;

  document.getElementById('dashboardUltimaMedicao').innerHTML = ultima ? `
    <div class="summary-box"><strong>Data:</strong> ${ultima.data || '-'}</div>
    <div class="summary-box"><strong>Horário:</strong> ${ultima.horario || '-'}</div>
    <div class="summary-box"><strong>Pressão:</strong> ${ultima.sistolica || '-'} / ${ultima.diastolica || '-'} mmHg</div>
    <div class="summary-box"><strong>Classificação da pressão:</strong> ${classificarPressao(ultima.sistolica, ultima.diastolica)}</div>
    <div class="summary-box"><strong>Glicemia:</strong> ${ultima.glicemia || '-'} mg/dL</div>
    <div class="summary-box"><strong>Classificação da glicemia:</strong> ${classificarGlicemia(ultima.glicemia)}</div>
    <div class="summary-box"><strong>Frequência cardíaca:</strong> ${ultima.frequencia || '-'} bpm</div>
    <div class="summary-box"><strong>Saturação:</strong> ${ultima.saturacao || '-'} %</div>
    <div class="summary-box"><strong>Peso:</strong> ${ultima.peso || '-'} kg</div>
    <div class="summary-box"><strong>Temperatura:</strong> ${ultima.temperatura || '-'} °C</div>
    <div class="summary-box"><strong>Observações:</strong> ${ultima.observacoes || '-'}</div>
  ` : `<p>Nenhuma medição registrada.</p>`;

  if (!medicoes.length) {
    document.getElementById('dashboardHistorico').innerHTML = '<p>Nenhuma medição registrada.</p>';
  } else {
    let tabela = `
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Hora</th>
            <th>Sistólica</th>
            <th>Diastólica</th>
            <th>Pressão</th>
            <th>Glicemia</th>
            <th>Class. Glicemia</th>
            <th>FC</th>
            <th>Sat.</th>
            <th>Peso</th>
            <th>Temp.</th>
          </tr>
        </thead>
        <tbody>
    `;

    medicoes.forEach(m => {
      tabela += `
        <tr>
          <td>${m.data || '-'}</td>
          <td>${m.horario || '-'}</td>
          <td>${m.sistolica || '-'}</td>
          <td>${m.diastolica || '-'}</td>
          <td>${classificarPressao(m.sistolica, m.diastolica)}</td>
          <td>${m.glicemia || '-'}</td>
          <td>${classificarGlicemia(m.glicemia)}</td>
          <td>${m.frequencia || '-'}</td>
          <td>${m.saturacao || '-'}</td>
          <td>${m.peso || '-'}</td>
          <td>${m.temperatura || '-'}</td>
        </tr>
      `;
    });

    tabela += '</tbody></table>';
    document.getElementById('dashboardHistorico').innerHTML = tabela;
  }

  renderChart(medicoes);
}

function renderChart(medicoes) {
  const labels = medicoes.map(m => `${m.data || ''} ${m.horario || ''}`.trim());

  if (glicemiaChart) glicemiaChart.destroy();
  if (pressaoChart) pressaoChart.destroy();
  if (fcChart) fcChart.destroy();
  if (saturacaoChart) saturacaoChart.destroy();
  if (pesoChart) pesoChart.destroy();
  if (temperaturaChart) temperaturaChart.destroy();

  glicemiaChart = new Chart(document.getElementById('glicemiaChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Glicemia (mg/dL)',
        data: medicoes.map(m => Number(m.glicemia || 0)),
        borderWidth: 2,
        tension: 0.25
      }]
    },
    options: { responsive: true }
  });

  pressaoChart = new Chart(document.getElementById('pressaoChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Sistólica (mmHg)',
          data: medicoes.map(m => Number(m.sistolica || 0)),
          borderWidth: 2,
          tension: 0.25
        },
        {
          label: 'Diastólica (mmHg)',
          data: medicoes.map(m => Number(m.diastolica || 0)),
          borderWidth: 2,
          tension: 0.25
        }
      ]
    },
    options: { responsive: true }
  });

  fcChart = new Chart(document.getElementById('fcChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Frequência cardíaca (bpm)',
        data: medicoes.map(m => Number(m.frequencia || 0)),
        borderWidth: 2,
        tension: 0.25
      }]
    },
    options: { responsive: true }
  });

  saturacaoChart = new Chart(document.getElementById('saturacaoChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Saturação (%)',
        data: medicoes.map(m => Number(m.saturacao || 0)),
        borderWidth: 2,
        tension: 0.25
      }]
    },
    options: { responsive: true }
  });

  pesoChart = new Chart(document.getElementById('pesoChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Peso (kg)',
        data: medicoes.map(m => Number(m.peso || 0)),
        borderWidth: 2,
        tension: 0.25
      }]
    },
    options: { responsive: true }
  });

  temperaturaChart = new Chart(document.getElementById('temperaturaChart').getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperatura (°C)',
        data: medicoes.map(m => Number(m.temperatura || 0)),
        borderWidth: 2,
        tension: 0.25
      }]
    },
    options: { responsive: true }
  });
}

function abrirTelaImpressao() {
  goToScreen('printScreen');
}

function renderPrintScreen() {
  const perfil = getData(STORAGE_KEYS.perfil, {});
  const medicoes = getData(STORAGE_KEYS.medicoes, []);

  document.getElementById('printPerfil').innerHTML = `
    <p><strong>Nome:</strong> ${perfil.nome || '-'}</p>
    <p><strong>Data de nascimento:</strong> ${perfil.nascimento || '-'}</p>
    <p><strong>Sexo:</strong> ${perfil.sexo || '-'}</p>
    <p><strong>Altura:</strong> ${perfil.altura ? perfil.altura + ' cm' : '-'}</p>
    <p><strong>Peso base:</strong> ${perfil.pesoBase ? perfil.pesoBase + ' kg' : '-'}</p>
    <p><strong>Circunferência abdominal:</strong> ${perfil.abdominal ? perfil.abdominal + ' cm' : '-'}</p>
    <p><strong>Diabetes:</strong> ${perfil.diabetes || '-'}</p>
    <p><strong>Hipertensão:</strong> ${perfil.hipertensao || '-'}</p>
    <p><strong>Fuma:</strong> ${perfil.fuma || '-'}</p>
    <p><strong>Consumo de álcool:</strong> ${perfil.alcool || '-'}</p>
    <p><strong>Observações gerais:</strong> ${perfil.observacoes || '-'}</p>
  `;

  if (!medicoes.length) {
    document.getElementById('printHistorico').innerHTML = '<p>Nenhuma medição registrada.</p>';
    return;
  }

  let tabela = `
    <table>
      <thead>
        <tr>
          <th>Data</th>
          <th>Hora</th>
          <th>PA Sistólica</th>
          <th>PA Diastólica</th>
          <th>Class. Pressão</th>
          <th>Glicemia</th>
          <th>Class. Glicemia</th>
          <th>FC</th>
          <th>Sat.</th>
          <th>Peso</th>
          <th>Temp.</th>
          <th>Observações</th>
        </tr>
      </thead>
      <tbody>
  `;

  medicoes.forEach(m => {
    tabela += `
      <tr>
        <td>${m.data || '-'}</td>
        <td>${m.horario || '-'}</td>
        <td>${m.sistolica || '-'}</td>
        <td>${m.diastolica || '-'}</td>
        <td>${classificarPressao(m.sistolica, m.diastolica)}</td>
        <td>${m.glicemia || '-'}</td>
        <td>${classificarGlicemia(m.glicemia)}</td>
        <td>${m.frequencia || '-'}</td>
        <td>${m.saturacao || '-'}</td>
        <td>${m.peso || '-'}</td>
        <td>${m.temperatura || '-'}</td>
        <td>${m.observacoes || '-'}</td>
      </tr>
    `;
  });

  tabela += '</tbody></table>';
  document.getElementById('printHistorico').innerHTML = tabela;
}

function alterarFonte(valor) {
  const atualBruto = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-scale')
    .trim();

  const atual = parseFloat(atualBruto) || 1;
  let novo = atual + valor;

  if (novo < 0.8) novo = 0.8;
  if (novo > 1.6) novo = 1.6;

  document.documentElement.style.setProperty('--font-scale', novo);
  localStorage.setItem('sec_font_scale', novo);
}

function toggleTema() {
  document.body.classList.toggle('tema-noite');
  const temaAtual = document.body.classList.contains('tema-noite') ? 'noite' : 'dia';
  localStorage.setItem('sec_tema', temaAtual);
}

function aplicarPreferenciasVisuais() {
  const fontScaleSalvo = localStorage.getItem('sec_font_scale');
  const temaSalvo = localStorage.getItem('sec_tema');

  if (fontScaleSalvo) {
    document.documentElement.style.setProperty('--font-scale', fontScaleSalvo);
  } else {
    document.documentElement.style.setProperty('--font-scale', '1');
  }

  if (temaSalvo === 'noite') {
    document.body.classList.add('tema-noite');
  } else {
    document.body.classList.remove('tema-noite');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const cadastroForm = document.getElementById('cadastroForm');
  const loginForm = document.getElementById('loginForm');
  const perfilForm = document.getElementById('perfilForm');
  const medicaoForm = document.getElementById('medicaoForm');
  const loginUpdateForm = document.getElementById('loginUpdateForm');

  if (cadastroForm) cadastroForm.addEventListener('submit', cadastroHandler);
  if (loginForm) loginForm.addEventListener('submit', loginHandler);
  if (perfilForm) perfilForm.addEventListener('submit', perfilHandler);
  if (medicaoForm) medicaoForm.addEventListener('submit', medicaoHandler);
  if (loginUpdateForm) loginUpdateForm.addEventListener('submit', loginUpdateHandler);

  aplicarPreferenciasVisuais();

  if (window.VLibras) {
    new window.VLibras.Widget('https://vlibras.gov.br/app');
  }
});
