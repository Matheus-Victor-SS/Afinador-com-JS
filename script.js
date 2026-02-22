let contexto;
let analisador;
let dados;
let rodando = false;

let frequencias = [];
let notaAtual = "";
let notaCandidata = "";
let contadorTroca = 0;

let centsSuave = 0;

const LIMITE_TROCA = 6;
const LIMITE_AFINADO = 8;

async function iniciarAfinador() {

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    contexto = new AudioContext();
    analisador = contexto.createAnalyser();
    analisador.fftSize = 2048;

    const microfone = contexto.createMediaStreamSource(stream);
    microfone.connect(analisador);

    dados = new Float32Array(analisador.fftSize);

    rodando = true;
    atualizar();
}

function atualizar() {
    if (!rodando) return;

    analisador.getFloatTimeDomainData(dados);

    const freq = detectarFrequencia(dados, contexto.sampleRate);

    if (freq !== -1) {

        // 🔥 SUAVIZA FREQUÊNCIA
        frequencias.push(freq);
        if (frequencias.length > 8) frequencias.shift();

        const media =
            frequencias.reduce((a, b) => a + b) / frequencias.length;

        const resultado = analisarNota(media);

        // 🔒 CONTROLE INTELIGENTE DE TROCA
        if (notaAtual === "") {
            notaAtual = resultado.nome;
        }

        if (resultado.nome !== notaAtual) {

            if (resultado.nome === notaCandidata) {
                contadorTroca++;
            } else {
                notaCandidata = resultado.nome;
                contadorTroca = 0;
            }

            if (contadorTroca > LIMITE_TROCA) {
                notaAtual = notaCandidata;
                contadorTroca = 0;
            }
        }

        document.getElementById("nota").innerText = notaAtual;
        document.getElementById("hz").innerText =
            Math.round(media) + " Hz";

        // 🔥 SUAVIZA CENTS
        centsSuave = centsSuave * 0.85 + resultado.diferenca * 0.15;

        atualizarPonteiro(centsSuave);
    }

    requestAnimationFrame(atualizar);
}

function analisarNota(freq) {

    const notas = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];

    const numero = 12 * (Math.log2(freq / 440));
    const notaNumero = Math.round(numero);
    const indice = notaNumero + 69;

    const nome = notas[indice % 12];

    const freqIdeal = 440 * Math.pow(2, notaNumero / 12);
    const diferenca = 1200 * Math.log2(freq / freqIdeal);

    return { nome, diferenca };
}

function atualizarPonteiro(cents) {

    const ponteiro = document.getElementById("ponteiro");
    const notaTexto = document.getElementById("nota");

    const limite = 50; // -50 a +50 cents
    const larguraBarra = 300;

    // Limita o valor
    const valor = Math.max(-limite, Math.min(limite, cents));

    // Converte cents em posição na barra
    const porcentagem = (valor + limite) / (limite * 2);
    const posicao = porcentagem * larguraBarra;

    ponteiro.style.left = posicao + "px";

    // 🔥 AGORA DEFINIMOS A ÁREA VERDE FIXA
    const centro = larguraBarra / 2;
    const larguraVerde = 40; // tamanho da zona verde

    const inicioVerde = centro - larguraVerde / 2;
    const fimVerde = centro + larguraVerde / 2;

    // Se ponteiro estiver dentro da área verde
    if (posicao >= inicioVerde && posicao <= fimVerde) {
        notaTexto.style.color = "#00ff88";
    } else {
        notaTexto.style.color = "#999";
    }
}

function detectarFrequencia(buffer, sampleRate) {

    let SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }

    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;

    let r1 = 0, r2 = SIZE - 1;
    let thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < thres) {
            r1 = i;
            break;
        }
    }

    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < thres) {
            r2 = SIZE - i;
            break;
        }
    }

    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

    let c = new Array(SIZE).fill(0);

    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] += buffer[j] * buffer[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;

    let maxval = -1, maxpos = -1;

    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }

    if (maxpos === -1) return -1;

    return sampleRate / maxpos;
}