async function iniciarAfinador() {

    const microfone = await navigator.mediaDevices.getUserMedia({ audio: true });

    const contexto = new AudioContext();
    await contexto.resume();

    const fonte = contexto.createMediaStreamSource(microfone);
    const analisador = contexto.createAnalyser();

    analisador.fftSize = 2048;
    fonte.connect(analisador);

    const dados = new Float32Array(analisador.fftSize);

    let ultimoSom = Date.now();

    // 🔥 Variáveis de estabilização
    let historicoFrequencias = [];
    let ultimaNotaMostrada = "";
    let contadorEstavel = 0;

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const frequencia = detectarFrequencia(dados, contexto.sampleRate);
        const agora = Date.now();

        if (frequencia !== -1) {

            // 🔥 Suavização (guardar últimas 5 leituras)
            historicoFrequencias.push(frequencia);
            if (historicoFrequencias.length > 5) {
                historicoFrequencias.shift();
            }

            // Média
            const media = historicoFrequencias.reduce((a, b) => a + b, 0) / historicoFrequencias.length;

            const resultado = analisarNota(media);

            // 🔥 Só muda a nota se repetir 3 vezes seguidas
            if (resultado.nome === ultimaNotaMostrada) {
                contadorEstavel++;
            } else {
                contadorEstavel = 0;
            }

            if (contadorEstavel > 2) {

                ultimoSom = agora;

                document.getElementById("nota").innerText = resultado.nome;
                document.getElementById("hz").innerText = Math.round(media) + " Hz";

                if (resultado.diferenca > 5) {
                    document.getElementById("altura").innerText = "🔺 Alto";
                }
                else if (resultado.diferenca < -5) {
                    document.getElementById("altura").innerText = "🔻 Baixo";
                }
                else {
                    document.getElementById("altura").innerText = "✅ Afinado";
                }
            }

            ultimaNotaMostrada = resultado.nome;
        }

        // Limpa depois de 2.5 segundos sem som
        if (agora - ultimoSom > 2500) {
            document.getElementById("nota").innerText = "";
            document.getElementById("hz").innerText = "";
            document.getElementById("altura").innerText = "";
            historicoFrequencias = [];
        }

        requestAnimationFrame(atualizar);
    }

    atualizar();
}



// 🎵 Analisa nota
function analisarNota(freq) {

    const notas = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];

    const numero = 12 * (Math.log2(freq / 440));
    const notaNumero = Math.round(numero);
    const indice = notaNumero + 69;

    const nomeNota = notas[indice % 12];

    const frequenciaIdeal = 440 * Math.pow(2, notaNumero / 12);

    const diferenca = 1200 * Math.log2(freq / frequenciaIdeal);

    return {
        nome: nomeNota,
        diferenca: diferenca
    };
}



// 🎯 Detectar frequência
function detectarFrequencia(dados, taxa) {

    let tamanho = dados.length;
    let melhorOffset = -1;
    let melhorCorrelacao = 0;

    for (let offset = 20; offset < 1000; offset++) {

        let correlacao = 0;

        for (let i = 0; i < tamanho - offset; i++) {
            correlacao += dados[i] * dados[i + offset];
        }

        correlacao = correlacao / (tamanho - offset);

        if (correlacao > melhorCorrelacao) {
            melhorCorrelacao = correlacao;
            melhorOffset = offset;
        }
    }

    if (melhorCorrelacao > 0.02) {
        return taxa / melhorOffset;
    }

    return -1;
}