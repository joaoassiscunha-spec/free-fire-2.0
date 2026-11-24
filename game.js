// Configurações principais do jogo
const TOTAL_RODADAS = 10;
const PONTOS_POR_ACERTO = 100;
const MAXIMO_PONTOS = TOTAL_RODADAS * PONTOS_POR_ACERTO;

// Variáveis de estado da partida
let rodadaAtual = 1;
let pontos = 0;
let sobreviventes = 100;
let tempoInicioPartida = 0;
let temporizadorRodada = null;
let tempoRestante = 0;
let tempoMaximoRodada = 15;
let desafioAtual = null;
let jogoEmAndamento = false;

// Referências dos elementos da tela
const htmlElement = document.documentElement;
const textoRodada = document.getElementById("texto-rodada");
const textoSobreviventes = document.getElementById("texto-sobreviventes");
const textoPontos = document.getElementById("texto-pontos");
const barraTempoProgresso = document.getElementById("barra-tempo-progresso");

const telaInicio = document.getElementById("tela-inicio");
const telaArena = document.getElementById("tela-arena");
const telaFeedback = document.getElementById("tela-feedback");
const telaFim = document.getElementById("tela-fim");

const textoConta = document.getElementById("texto-conta");
const campoAlvos = document.getElementById("campo-alvos");

const iconeFeedback = document.getElementById("icone-feedback");
const tituloFeedback = document.getElementById("titulo-feedback");
const explicacaoFeedback = document.getElementById("explicacao-feedback");

const iconeFim = document.getElementById("icone-fim");
const tituloFim = document.getElementById("titulo-fim");
const mensagemFim = document.getElementById("mensagem-fim");
const finalPontos = document.getElementById("final-pontos");
const finalRodadas = document.getElementById("final-rodadas");

// Botões
const btnTema = document.getElementById("btn-tema");
const btnTelaCheia = document.getElementById("btn-tela-cheia");
const btnIniciar = document.getElementById("btn-iniciar");
const btnProximaRodada = document.getElementById("btn-proxima-rodada");
const btnReiniciar = document.getElementById("btn-reiniciar");

// --- COMUNICAÇÃO COM O PORTAL (CONTRATO VRGAME) ---

function avisarPortalPronto() {
  window.parent.postMessage({ type: "vrgame:ready" }, "*");
}

function avisarPortalTamanho() {
  const altura = document.documentElement.scrollHeight;
  window.parent.postMessage({ type: "vrgame:resize", height: altura }, "*");
}

function avisarPortalFim() {
  const tempoTotalMs = Date.now() - tempoInicioPartida;
  window.parent.postMessage({
    type: "vrgame:finish",
    score: pontos,
    maxScore: MAXIMO_PONTOS,
    timeMs: tempoTotalMs,
    detail: { jogo: "arena-estelar" }
  }, "*");
}

function aplicarTema(tema) {
  if (tema === "light" || tema === "dark") {
    htmlElement.setAttribute("data-theme", tema);
  }
}

function alternarTelaCheia() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// Escuta mensagens enviadas pelo portal
window.addEventListener("message", (evento) => {
  const dados = evento.data;
  if (!dados || typeof dados !== "object") return;

  if (dados.type === "vrgame:theme" && dados.theme) {
    aplicarTema(dados.theme);
  }
  if (dados.type === "vrgame:fullscreen") {
    alternarTelaCheia();
  }
});

// Observa mudanças no tamanho da tela para avisar o portal
window.addEventListener("resize", avisarPortalTamanho);

// --- CONTROLE DE TELAS E INTERFACE ---

function mostrarTela(telaEscolhida) {
  [telaInicio, telaArena, telaFeedback, telaFim].forEach((tela) => {
    tela.classList.remove("ativa");
  });
  telaEscolhida.classList.add("ativa");
  avisarPortalTamanho();
}

function atualizarPainel() {
  textoRodada.textContent = `${rodadaAtual} / ${TOTAL_RODADAS}`;
  textoSobreviventes.textContent = sobreviventes;
  textoPontos.textContent = pontos;
}

// --- GERADOR DE DESAFIOS MATEMÁTICOS (DIFICULDADE CRESCENTE) ---

function sortearInteiro(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gerarDesafio(rodada) {
  let contaTexto = "";
  let respostaCerta = 0;
  let explicacao = "";
  let distratores = new Set();

  if (rodada <= 3) {
    // Rodadas 1 a 3: Adição simples e multiplicação básica
    if (rodada % 2 === 1) {
      const a = sortearInteiro(6, 18);
      const b = sortearInteiro(5, 15);
      respostaCerta = a + b;
      contaTexto = `${a} + ${b}`;
      explicacao = `Somando ${a} com ${b}, chegamos exatamente a ${respostaCerta}.`;
      distratores.add(respostaCerta + 2);
      distratores.add(respostaCerta - 1);
      distratores.add(respostaCerta + 10);
    } else {
      const a = sortearInteiro(2, 6);
      const b = sortearInteiro(3, 7);
      respostaCerta = a * b;
      contaTexto = `${a} × ${b}`;
      explicacao = `${a} vezes ${b} é o mesmo que somar o ${b} por ${a} vezes, resultando em ${respostaCerta}.`;
      distratores.add(a + b); // Erro comum: somar em vez de multiplicar
      distratores.add(respostaCerta + b);
      distratores.add(respostaCerta - a);
    }
  } else if (rodada <= 7) {
    // Rodadas 4 a 7: Tabuada maior e expressão (multiplicação + adição)
    if (rodada <= 5) {
      const a = sortearInteiro(6, 9);
      const b = sortearInteiro(6, 9);
      respostaCerta = a * b;
      contaTexto = `${a} × ${b}`;
      explicacao = `Na tabuada, ${a} × ${b} é igual a ${respostaCerta}.`;
      distratores.add(respostaCerta + a);
      distratores.add(respostaCerta - b);
      distratores.add(a + b);
    } else {
      const a = sortearInteiro(3, 6);
      const b = sortearInteiro(4, 7);
      const c = sortearInteiro(3, 12);
      respostaCerta = a * b + c;
      contaTexto = `${a} × ${b} + ${c}`;
      explicacao = `Primeiro fazemos a multiplicação (${a} × ${b} = ${a * b}) e depois somamos ${c}, dando ${respostaCerta}.`;
      distratores.add(a * (b + c)); // Erro comum: somar antes de multiplicar
      distratores.add(respostaCerta + 5);
      distratores.add(respostaCerta - 4);
    }
  } else {
    // Rodadas 8 a 10: Desafios finais da Arena Estelar
    const a = sortearInteiro(5, 9);
    const b = sortearInteiro(6, 9);
    const c = sortearInteiro(10, 25);
    respostaCerta = a * b + c;
    contaTexto = `${a} × ${b} + ${c}`;
    explicacao = `Calculando primeiro ${a} × ${b} = ${a * b} e somando ${c} no final, o resultado certo é ${respostaCerta}.`;
    distratores.add(a * (b + c));
    distratores.add(respostaCerta + 10);
    distratores.add(respostaCerta - 6);
  }

  // Garante exatamente 3 opções erradas diferentes da resposta certa
  const opcoesErradas = Array.from(distratores).filter((n) => n !== respostaCerta && n > 0);
  while (opcoesErradas.length < 3) {
    const candidato = respostaCerta + sortearInteiro(-9, 9);
    if (candidato > 0 && candidato !== respostaCerta && !opcoesErradas.includes(candidato)) {
      opcoesErradas.push(candidato);
    }
  }

  const todasOpcoes = [respostaCerta, ...opcoesErradas.slice(0, 3)];
  // Embaralha os alvos na tela
  todasOpcoes.sort(() => Math.random() - 0.5);

  return {
    contaTexto,
    respostaCerta,
    explicacao,
    opcoes: todasOpcoes
  };
}

// --- LÓGICA DA PARTIDA ---

function iniciarPartida() {
  rodadaAtual = 1;
  pontos = 0;
  sobreviventes = 100;
  tempoInicioPartida = Date.now();
  jogoEmAndamento = true;
  carregarRodada();
}

function carregarRodada() {
  atualizarPainel();
  desafioAtual = gerarDesafio(rodadaAtual);
  textoConta.textContent = desafioAtual.contaTexto;

  // Limpa e cria os 4 alvos clicáveis
  campoAlvos.innerHTML = "";
  desafioAtual.opcoes.forEach((numero) => {
    const botaoAlvo = document.createElement("button");
    botaoAlvo.type = "button";
    botaoAlvo.className = "alvo-espacial";
    botaoAlvo.textContent = numero;
    botaoAlvo.setAttribute("aria-label", `Alvo número ${numero}`);
    botaoAlvo.addEventListener("click", () => verificarTiro(numero));
    campoAlvos.appendChild(botaoAlvo);
  });

  mostrarTela(telaArena);
  iniciarTemporizador();
}

function iniciarTemporizador() {
  pararTemporizador();
  // O tempo diminui levemente nas rodadas finais para aumentar a emoção
  tempoMaximoRodada = Math.max(9, 16 - Math.floor(rodadaAtual * 0.6));
  tempoRestante = tempoMaximoRodada;
  atualizarBarraTempo();

  temporizadorRodada = setInterval(() => {
    tempoRestante -= 0.1;
    atualizarBarraTempo();

    if (tempoRestante <= 0) {
      pararTemporizador();
      encerrarPorEliminacao("O tempo da zona segura acabou!");
    }
  }, 100);
}

function pararTemporizador() {
  if (temporizadorRodada) {
    clearInterval(temporizadorRodada);
    temporizadorRodada = null;
  }
}

function atualizarBarraTempo() {
  const porcentagem = Math.max(0, (tempoRestante / tempoMaximoRodada) * 100);
  barraTempoProgresso.style.width = `${porcentagem}%`;

  if (porcentagem > 50) {
    barraTempoProgresso.style.backgroundColor = "var(--cor-sucesso)";
  } else if (porcentagem > 25) {
    barraTempoProgresso.style.backgroundColor = "var(--cor-destaque)";
  } else {
    barraTempoProgresso.style.backgroundColor = "var(--cor-erro)";
  }
}

function verificarTiro(numeroEscolhido) {
  if (!jogoEmAndamento) return;
  pararTemporizador();

  if (numeroEscolhido === desafioAtual.respostaCerta) {
    // Acertou o alvo!
    pontos += PONTOS_POR_ACERTO;
    sobreviventes = Math.max(1, Math.round(100 - (rodadaAtual * 9.9)));
    atualizarPainel();

    if (rodadaAtual >= TOTAL_RODADAS) {
      encerrarComVitoria();
    } else {
      iconeFeedback.textContent = "🎯";
      tituloFeedback.textContent = `Rodada ${rodadaAtual} Concluída!`;
      explicacaoFeedback.textContent = `Você acertou ${desafioAtual.respostaCerta}! ${desafioAtual.explicacao}`;
      mostrarTela(telaFeedback);
    }
  } else {
    // Eliminação direta ao errar
    encerrarPorEliminacao(`Você mirou no alvo ${numeroEscolhido}, mas o certo era ${desafioAtual.respostaCerta}.`);
  }
}

function encerrarPorEliminacao(motivoErro) {
  jogoEmAndamento = false;
  barraTempoProgresso.style.width = "0%";
  iconeFim.textContent = "💥";
  tituloFim.textContent = "Eliminado da Arena!";
  mensagemFim.textContent = `${motivoErro} ${desafioAtual.explicacao}`;
  finalPontos.textContent = pontos;
  finalRodadas.textContent = `${rodadaAtual - 1} / ${TOTAL_RODADAS}`;
  mostrarTela(telaFim);
  avisarPortalFim();
}

function encerrarComVitoria() {
  jogoEmAndamento = false;
  sobreviventes = 1;
  atualizarPainel();
  barraTempoProgresso.style.width = "100%";
  barraTempoProgresso.style.backgroundColor = "var(--cor-sucesso)";
  iconeFim.textContent = "🏆";
  tituloFim.textContent = "Vitória! #1 na Arena Estelar";
  mensagemFim.textContent = `Incrível! Você sobreviveu às 10 rodadas e dominou as contas de adição e multiplicação. ${desafioAtual.explicacao}`;
  finalPontos.textContent = pontos;
  finalRodadas.textContent = `${TOTAL_RODADAS} / ${TOTAL_RODADAS}`;
  mostrarTela(telaFim);
  avisarPortalFim();
}

// --- EVENTOS DE CLIQUE ---

btnTema.addEventListener("click", () => {
  const temaAtual = htmlElement.getAttribute("data-theme");
  aplicarTema(temaAtual === "dark" ? "light" : "dark");
});

btnTelaCheia.addEventListener("click", alternarTelaCheia);
btnIniciar.addEventListener("click", iniciarPartida);

btnProximaRodada.addEventListener("click", () => {
  rodadaAtual++;
  carregarRodada();
});

btnReiniciar.addEventListener("click", iniciarPartida);

// Inicialização ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
  avisarPortalPronto();
  avisarPortalTamanho();
});