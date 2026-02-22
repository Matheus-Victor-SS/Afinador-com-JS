async function iniciarAfinador() {

    const microfone = await navigator.mediaDevices.getUserMedia({ audio: true });

    const contextoAudio = new AudioContext();
    await contextoAudio.resume();

    const fonte = contextoAudio.createMediaStreamSource(microfone);
    const analisador = contextoAudio.createAnalyser();

    analisador.fftSize = 2048;
    fonte.connect(analisador);

    const dados = new Float32Array(analisador.fftSize);

    // 🔥 Guardar última nota
    let ultimaNota = null;
    let ultimaFrequencia = null;
    let ultimoTempoDetectado = 0;

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const frequencia = detectarFrequencia(dados, contextoAudio.sampleRate);

        const agora = Date.now();

        if (frequencia !== -1) {

            const nota = converterParaNota(frequencia);

            ultimaNota = nota;
            ultimaFrequencia = frequencia;
            ultimoTempoDetectado = agora;

            document.getElementById("nota").innerText = nota;
            document.getElementById("hz").innerText = Math.round(frequencia) + " Hz";
        }

        // ⏳ Se ficar 2 segundos sem som, limpa a tela
        if (agora - ultimoTempoDetectado > 2000) {
            document.getElementById("nota").innerText = "";
            document.getElementById("hz").innerText = "";
        }

        requestAnimationFrame(atualizar);
    }

    atualizar();
}



function converterParaNota(frequencia) {
    const notas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const numero = 12 * (Math.log2(frequencia / 440));
    const indice = Math.round(numero) + 69;
    return notas[indice % 12];
}



function detectarFrequencia(dados, taxa) {

    let tamanho = dados.length;
    let melhorOffset = -1;
    let melhorCorrelacao = 0;

    for (let offset = 8; offset < 1000; offset++) {

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

    if (melhorCorrelacao > 0.01) {
        return taxa / melhorOffset;
    }

    return -1;
}