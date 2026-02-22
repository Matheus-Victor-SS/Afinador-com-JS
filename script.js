async function iniciarAfinador() {

    const microfone = await navigator.mediaDevices.getUserMedia({ audio: true });

    const contextoAudio = new AudioContext();
    const fonte = contextoAudio.createMediaStreamSource(microfone);

    const analisador = contextoAudio.createAnalyser();
    analisador.fftSize = 2048;

    fonte.connect(analisador);

    const dados = new Float32Array(analisador.fftSize);

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const frequencia = detectarFrequencia(dados, contextoAudio.sampleRate);

        if (frequencia !== -1) {

            const nota = converterParaNota(frequencia);

            document.getElementById("nota").innerText = nota;
            document.getElementById("hz").innerText = Math.round(frequencia) + " Hz";
            document.getElementById("altura").innerText = "Som detectado!";
        } else {
            document.getElementById("altura").innerText = "Silêncio...";
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