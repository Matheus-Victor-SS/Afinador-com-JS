async function iniciarAfinador() {

    //  Pedir acesso ao microfone
    const microfone = await navigator.mediaDevices.getUserMedia({ audio: true });

    //  Criar sistema de áudio
    const contextoAudio = new AudioContext();

    //  Conectar microfone ao sistema
    const fonteSom = contextoAudio.createMediaStreamSource(microfone);

    //  Criar analisador de som
    const analisador = contextoAudio.createAnalyser();
    analisador.fftSize = 2048;

    fonteSom.connect(analisador);

    //  Criar espaço para guardar os dados do som
    const dadosSom = new Float32Array(analisador.fftSize);

    //  Função que fica rodando o tempo todo
    function atualizar() {

        // Pega o som atual do microfone
        analisador.getFloatTimeDomainData(dadosSom);

        // Descobre a frequência
        const frequencia = detectarFrequencia(dadosSom, contextoAudio.sampleRate);

        if (frequencia !== -1) {

            const nota = converterParaNota(frequencia);

            document.getElementById("nota").innerText = nota;
            document.getElementById("hz").innerText = Math.round(frequencia) + " Hz";
        }

        requestAnimationFrame(atualizar);
    }

    atualizar();
}



//Converte frequência em nota musical
function converterParaNota(frequencia) {

    const nomesNotas = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    // 440Hz
    const numeroNota = 12 * (Math.log2(frequencia / 440));

    const indice = Math.round(numeroNota) + 69;

    return nomesNotas[indice % 12];
}



// Detecta a frequência do som
function detectarFrequencia(dados, taxaAmostragem) {

    let tamanho = dados.length;
    let volume = 0;

    // Calcula volume
    for (let i = 0; i < tamanho; i++) {
        volume += dados[i] * dados[i];
    }

    volume = Math.sqrt(volume / tamanho);

    // Se estiver muito baixo, considera silêncio
    if (volume < 0.01) return -1;

    let melhorPosicao = -1;
    let melhorValor = 0;

    // Testa vários deslocamentos
    for (let deslocamento = 0; deslocamento < tamanho; deslocamento++) {

        let comparacao = 0;

        for (let i = 0; i < tamanho - deslocamento; i++) {
            comparacao += dados[i] * dados[i + deslocamento];
        }

        if (comparacao > melhorValor) {
            melhorValor = comparacao;
            melhorPosicao = deslocamento;
        }
    }

    if (melhorPosicao > 0) {
        return taxaAmostragem / melhorPosicao;
    }

    return -1;
}