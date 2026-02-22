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

    // 🔥 Estabilização profissional
    let frequenciaSuavizada = null;
    let notaTravada = null;

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const freqDetectada = detectarFrequencia(dados, contexto.sampleRate);
        const agora = Date.now();

        if (freqDetectada !== -1) {

            // 🔥 Suavização exponencial (muito mais estável)
            if (frequenciaSuavizada === null) {
                frequenciaSuavizada = freqDetectada;
            } else {
                frequenciaSuavizada = 
                    frequenciaSuavizada * 0.85 + freqDetectada * 0.15;
            }

            const resultado = analisarNota(frequenciaSuavizada);

            ultimoSom = agora;

            const notaElemento = document.getElementById("nota");
            document.getElementById("hz").innerText =
                Math.round(frequenciaSuavizada) + " Hz";

            // 🔥 Travar nota se estiver próxima
            if (!notaTravada || Math.abs(resultado.diferenca) > 25) {
                notaTravada = resultado.nome;
            }

            notaElemento.innerText = notaTravada;

            // 🎨 Cor
            if (Math.abs(resultado.diferenca) < 5) {
                notaElemento.style.color = "lime";
            } else {
                notaElemento.style.color = "#777";
            }

            // 🎯 Movimento suave do ponteiro
            let limite = 50;
            let diferencaLimitada =
                Math.max(-limite, Math.min(limite, resultado.diferenca));

            let porcentagem =
                50 + (diferencaLimitada / limite) * 50;

            document.getElementById("ponteiro")
                .style.left = porcentagem + "%";
        }

        if (agora - ultimoSom > 2500) {
            document.getElementById("nota").innerText = "--";
            document.getElementById("hz").innerText = "";
            document.getElementById("nota").style.color = "#777";
            document.getElementById("ponteiro").style.left = "50%";

            frequenciaSuavizada = null;
            notaTravada = null;
        }

        requestAnimationFrame(atualizar);
    }

    atualizar();
}



function analisarNota(freq) {

    const notas = ["Dó","Dó#","Ré","Ré#","Mi","Fá","Fá#","Sol","Sol#","Lá","Lá#","Si"];

    const numero = 12 * (Math.log2(freq / 440));
    const notaNumero = Math.round(numero);
    const indice = notaNumero + 69;

    const nome = notas[indice % 12];
    const freqIdeal = 440 * Math.pow(2, notaNumero / 12);
    const diferenca = 1200 * Math.log2(freq / freqIdeal);

    return { nome, diferenca };
}



function detectarFrequencia(dados, taxa) {

    let tamanho = dados.length;
    let melhorOffset = -1;
    let melhorCorrelacao = 0;

    for (let offset = 30; offset < 1000; offset++) {

        let correlacao = 0;

        for (let i = 0; i < tamanho - offset; i++) {
            correlacao += dados[i] * dados[i + offset];
        }

        correlacao /= (tamanho - offset);

        if (correlacao > melhorCorrelacao) {
            melhorCorrelacao = correlacao;
            melhorOffset = offset;
        }
    }

    if (melhorCorrelacao > 0.03) {
        return taxa / melhorOffset;
    }

    return -1;
}