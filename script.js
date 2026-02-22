let contexto;
let analisador;
let dados;
let rodando = false;
let usarBemol = true;

let frequencias = [];
let notaAtual = "";
let notaCandidata = "";
let contadorTroca = 0;

let centsSuave = 0;

const LIMITE_TROCA = 6;
const LIMITE_AFINADO = 8;

async function iniciarAfinador() {
    //permissão do navegador
    //stream é o som do navegador em tempo real
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    //analiza o som, a frequnecia em 2048 amostras, um equilibrio entre eficiencia e velocidade
    contexto = new AudioContext();
    analisador = contexto.createAnalyser();
    analisador.fftSize = 2048;

    //conecta o analisador de som com o microfone
    const microfone = contexto.createMediaStreamSource(stream);
    microfone.connect(analisador);

//armazena a medida propria de som em decimais
    dados = new Float32Array(analisador.fftSize);

    rodando = true;
    atualizar();
}
//mudar frequencia
function atualizar() {
    if (!rodando) return;

    analisador.getFloatTimeDomainData(dados);

    const freq = detectarFrequencia(dados, contexto.sampleRate);
//se tiver som, nao for silencio
    if (freq !== -1) {
//estabilização(Guardamos as últimas 8 leituras, se passar de 8, removemos a mais antiga)
        frequencias.push(freq);
        if (frequencias.length > 8) frequencias.shift();
//media das frequencias, para colocar uma mais aproximada
        const media =
            frequencias.reduce((a, b) => a + b) / frequencias.length;

        const resultado = analisarNota(media);
//nao fica mudando a nota atual
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
//só troca quando a mesma nota for tocada mais tempo, assim nao oscila
            if (contadorTroca > LIMITE_TROCA) {
                notaAtual = notaCandidata;
                contadorTroca = 0;
            }
        }

        document.getElementById("nota").innerText = notaAtual;
        document.getElementById("hz").innerText =
            Math.round(media) + " Hz";

//suavidade do ponteiro
        centsSuave = centsSuave * 0.85 + resultado.diferenca * 0.15;

        atualizarPonteiro(centsSuave);
    }

    requestAnimationFrame(atualizar);
}

function analisarNota(freq) {
//array com as notas
    const notasSustenido = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];
    const notasBemol = ["Dó", "Ré♭", "Ré", "Mi♭", "Mi", "Fá", "Sol♭", "Sol", "Lá♭", "Lá", "Si♭", "Si"];
//verifica a distancia da nota lá
    const numero = 12 * (Math.log2(freq / 440));
    const notaNumero = Math.round(numero);
    const indice = notaNumero + 69;

    const listaNotas = usarBemol ? notasBemol : notasSustenido;

    const nome = listaNotas[(indice % 12 + 12) % 12];

    const freqIdeal = 440 * Math.pow(2, notaNumero / 12);
    const diferenca = 1200 * Math.log2(freq / freqIdeal);

    return { nome, diferenca };
}

function atualizarPonteiro(cents) {

    const ponteiro = document.getElementById("ponteiro");
    const notaTexto = document.getElementById("nota");

    const limite = 50;
    const larguraBarra = 300;


    const valor = Math.max(-limite, Math.min(limite, cents));


    const porcentagem = (valor + limite) / (limite * 2);
    const posicao = porcentagem * larguraBarra;

    ponteiro.style.left = posicao + "px";


    const centro = larguraBarra / 2;
    const larguraVerde = 40; 

    const inicioVerde = centro - larguraVerde / 2;
    const fimVerde = centro + larguraVerde / 2;

    if (posicao >= inicioVerde && posicao <= fimVerde) {
        notaTexto.style.color = "#00ff88";
    } else {
        notaTexto.style.color = "#999";
    }
}

function alternarAcidente() {

    usarBemol = !usarBemol;

    const botao = document.getElementById("botaoAlterar");

    if (usarBemol) {
        botao.innerText = "♭";
        //tentativa de mudar o tamanho do bemol no botão
        botao.style.transform = "scale(1) translateY(-3px)";
    } else {
        botao.innerText = "♯";
        botao.style.transform = "scale(1) translateY(0px)";
    }
}

//frequencia
function detectarFrequencia(buffer, sampleRate) {
//ver se tem som o bastante
    let SIZE = buffer.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        rms += buffer[i] * buffer[i];
    }

    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) return -1;


//pega o inicio do som escutavel
    let r1 = 0, r2 = SIZE - 1;
    let thres = 0.2;

    for (let i = 0; i < SIZE / 2; i++) {
        if (Math.abs(buffer[i]) < thres) {
            r1 = i;
            break;
        }
    }
//pega o final do som
    for (let i = 1; i < SIZE / 2; i++) {
        if (Math.abs(buffer[SIZE - i]) < thres) {
            r2 = SIZE - i;
            break;
        }
    }
//tira os trechos silenciosos
    buffer = buffer.slice(r1, r2);
    SIZE = buffer.length;

//autocorrelação
    let c = new Array(SIZE).fill(0);
//compara ela consigo mesmo e vai se alterando
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] += buffer[j] * buffer[j + i];
        }
    }

//encontra o primeiro pico real (desconsidera o primeiro som, que geralmente é mais alto)
    let d = 0;
    while (c[d] > c[d + 1]) d++;

//encontra melhor periodo da onda
    let maxval = -1, maxpos = -1;

    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
//tranforma periodo da onda em frequencia
    if (maxpos === -1) return -1;

    return sampleRate / maxpos;
}