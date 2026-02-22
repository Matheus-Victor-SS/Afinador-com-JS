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

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const frequencia = detectarFrequencia(dados, contexto.sampleRate);
        const agora = Date.now();

        if (frequencia !== -1) {

            const resultado = analisarNota(frequencia);

            ultimoSom = agora;

            document.getElementById("nota").innerText = resultado.nome;
            document.getElementById("hz").innerText = Math.round(frequencia) + " Hz";

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

        // 🔥 Mantém a última nota por 2500ms (2.5 segundos)
        if (agora - ultimoSom > 2500) {
            document.getElementById("nota").innerText = "";
            document.getElementById("hz").innerText = "";
            document.getElementById("altura").innerText = "";
        }

        requestAnimationFrame(atualizar);
    }

    atualizar();
}



// 🎵 Analisa nota e diferença
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



// 🎯 Detectar frequência (autocorrelação simples)
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