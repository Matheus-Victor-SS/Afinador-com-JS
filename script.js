async function iniciarAfinador() {

    const microfone = await navigator.mediaDevices.getUserMedia({ audio: true });
    const contexto = new AudioContext();
    await contexto.resume();

    const fonte = contexto.createMediaStreamSource(microfone);
    const analisador = contexto.createAnalyser();

    analisador.fftSize = 2048;
    fonte.connect(analisador);

    const dados = new Float32Array(analisador.fftSize);

    let historico = [];
    let ultimoSom = Date.now();

    function atualizar() {

        analisador.getFloatTimeDomainData(dados);

        const freq = detectarFrequencia(dados, contexto.sampleRate);
        const agora = Date.now();

        if (freq !== -1) {

            historico.push(freq);
            if (historico.length > 5) historico.shift();

            const media = historico.reduce((a,b)=>a+b,0)/historico.length;

            const resultado = analisarNota(media);

            ultimoSom = agora;

            const notaElemento = document.getElementById("nota");
            notaElemento.innerText = resultado.nome;
            document.getElementById("hz").innerText = Math.round(media) + " Hz";

            // 🎨 Cor da nota
            if (Math.abs(resultado.diferenca) < 5) {
                notaElemento.style.color = "lime";
            } else {
                notaElemento.style.color = "#777";
            }

            // 📊 Barra visual (-50 a +50 cents)
            let limite = 50;
            let posicao = Math.max(-limite, Math.min(limite, resultado.diferenca));

            let porcentagem = (posicao + limite) / (limite * 2) * 100;
            document.getElementById("barra").style.left = porcentagem + "%";
            document.getElementById("barra").style.transform = "translateX(-50%)";
        }

        if (agora - ultimoSom > 2500) {
            document.getElementById("nota").innerText = "--";
            document.getElementById("hz").innerText = "";
            document.getElementById("nota").style.color = "#777";
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

    for (let offset = 20; offset < 1000; offset++) {

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

    if (melhorCorrelacao > 0.02) {
        return taxa / melhorOffset;
    }

    return -1;
}