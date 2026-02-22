async function iniciarAfinador() {

    const microfone = await navigator.mediaDevices.getUserMedia({ audio: true });

    const contexto = new AudioContext();
    await contexto.resume();

    const fonte = contexto.createMediaStreamSource(microfone);
    const analisador = contexto.createAnalyser();

    analisador.fftSize = 2048;
    fonte.connect(analisador);

    const dados = new Float32Array(analisador.fftSize);

    let ultimaNota = "";
    let ultimaFrequencia = 0;
    let ultimoSom = Date.now();

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const frequencia = detectarFrequencia(dados, contexto.sampleRate);

        const agora = Date.now();

        if (frequencia !== -1) {

            const nota = converterParaNota(frequencia);

            ultimaNota = nota;
            ultimaFrequencia = frequencia;
            ultimoSom = agora;

            document.getElementById("nota").innerText = ultimaNota;
            document.getElementById("hz").innerText = Math.round(ultimaFrequencia) + " Hz";
        }

        if (agora - ultimoSom > 5000) {
            document.getElementById("nota").innerText = "";
            document.getElementById("hz").innerText = "";
        }

        requestAnimationFrame(atualizar);
    }

    atualizar();
}




function converterParaNota(freq) {

    const notas = ["Dó", "Dó#", "Ré", "Ré#", "Mi", "Fá", "Fá#", "Sol", "Sol#", "Lá", "Lá#", "Si"];

    const numero = 12 * (Math.log2(freq / 440));
    const indice = Math.round(numero) + 69;

    return notas[indice % 12];
}




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