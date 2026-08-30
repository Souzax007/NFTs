const fitaTrack = document.querySelector('.fita-track');
const items = document.querySelectorAll('.fita-item');

if (fitaTrack && items.length > 0) {
    const originalHTML = fitaTrack.innerHTML;
    let originalWidth = fitaTrack.scrollWidth;

    while (fitaTrack.scrollWidth < originalWidth * 2 || fitaTrack.scrollWidth < window.innerWidth * 2) {
        fitaTrack.innerHTML += originalHTML;
    }

    const singleBlockWidth = originalWidth;

    let position = 0;
    const speed = 0.5;

    function animate() {
        position -= speed;

        if (Math.abs(position) >= singleBlockWidth) {
            position += singleBlockWidth;
        }

        fitaTrack.style.transform = `translateX(${position}px)`;
        requestAnimationFrame(animate);
    }

    animate();
}

const carrossel = document.querySelector('.carrossel');
const botaoEsquerda = document.querySelector('#botao-esquerda');
const botaoDireita = document.querySelector('#botao-direita');

if (carrossel && botaoEsquerda && botaoDireita) {
    let track = carrossel.querySelector('.carrossel-track');
    if (!track) {
        track = document.createElement('div');
        track.className = 'carrossel-track';
        track.style.display = 'flex';
        track.style.alignItems = 'center';
        track.style.position = 'relative';
        track.style.willChange = 'transform';
        while (carrossel.firstChild) {
            track.appendChild(carrossel.firstChild);
        }
        carrossel.appendChild(track);
        carrossel.style.overflow = 'visible';
    }
    track.style.position = 'relative'; // garante que offsetLeft dos itens seja relativo ao track, não a um ancestral distante

    const originalHTML = track.innerHTML;
    const originalWidth = track.scrollWidth;

    // duplica pra direita
    while (track.scrollWidth < originalWidth * 2 || track.scrollWidth < window.innerWidth * 2) {
        track.innerHTML += originalHTML;
    }

    // duplica pra esquerda (mesma quantidade de blocos), com um mínimo de
    // 3 blocos de cada lado pra sempre sobrar margem de segurança no loop
    const blocosDireita = Math.max(3, Math.round(track.scrollWidth / originalWidth));
    for (let i = 0; i < blocosDireita; i++) {
        track.innerHTML = originalHTML + track.innerHTML;
    }

    const itens = [...track.querySelectorAll('.item-carrossel')];
    // total de blocos no track = blocosDireita (lado direito, incluindo o original)
    // + blocosDireita (blocos prependados à esquerda) = blocosDireita * 2
    const itensOriginaisQtd = Math.round(itens.length / (blocosDireita * 2));

    // ===== CONFIG DO EFEITO LEQUE (MEIA-LUA) =====
    const MAX_ROTACAO = 18;
    const MAX_DESLOCAMENTO_Y = 40;
    const ESCALA_ATIVA = 1.15;
    const ESCALA_MINIMA = 0.85;
    const RAIO_INFLUENCIA = 3;
    const SOBREPOSICAO = 70; // px de overlap entre os círculos vizinhos — aumente pra ficar mais "colado"
    const DURACAO_TRANSICAO = 500; // ms — usado tanto pro track quanto pros cards
    const INTERVALO_AUTO = 3200;   // ms entre avanços automáticos

    itens.forEach((item) => {
        item.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`;
        item.style.transformOrigin = 'bottom center';
    });
    track.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`;

    // índice atual dentro do array "itens" (que inclui os clones)
    let indiceAtual = Math.round(blocosDireita * itensOriginaisQtd); // começa no primeiro bloco "real" do meio
    let temporizadorAutomatico;
    let travado = false;

    const larguraItem = () => itens[0].getBoundingClientRect().width;
    const gapPx = parseFloat(getComputedStyle(track).gap) || 16;

    const centralizarPeloIndice = () => {
        // trava de segurança: nunca deixa indiceAtual sair dos limites do array
        if (indiceAtual < 0) indiceAtual = 0;
        if (indiceAtual >= itens.length) indiceAtual = itens.length - 1;

        const item = itens[indiceAtual];
        const offset = item.offsetLeft - (carrossel.clientWidth - item.offsetWidth) / 2;
        track.style.transform = `translateX(${-offset}px)`;
    };

    const aplicarEfeitoLeque = () => {
        itens.forEach((item, index) => {
            const distancia = index - indiceAtual;
            const distanciaAbs = Math.abs(distancia);

            // overlap constante em TODA a fileira, sem exceção — isso é o
            // que garante que não sobre nenhum espaço vazio entre os itens
            item.style.marginLeft = index === 0 ? '' : `${-SOBREPOSICAO}px`;

            if (distanciaAbs > RAIO_INFLUENCIA) {
                item.style.transform = 'translateY(0) rotate(0deg) scale(0.8)';
                item.style.zIndex = 0;
                return;
            }

            const fator = distanciaAbs / RAIO_INFLUENCIA;
            const sinal = Math.sign(distancia);

            const rotacao = sinal * fator * MAX_ROTACAO;
            const deslocY = fator * MAX_DESLOCAMENTO_Y;
            const escala = distancia === 0
                ? ESCALA_ATIVA
                : ESCALA_ATIVA - (ESCALA_ATIVA - ESCALA_MINIMA) * fator;

            item.style.transform = `translateY(${deslocY}px) rotate(${rotacao}deg) scale(${escala})`;
            item.style.zIndex = distancia === 0 ? 100 : 100 - distanciaAbs;
        });

        itens.forEach((item, index) => item.classList.toggle('ativa', index === indiceAtual));
    };

    // depois da transição, se estivermos perto das pontas do array
    // (zona de clone), salta instantaneamente (sem transição) de volta
    // pra dentro de uma zona segura, andando de um bloco por vez —
    // "while" em vez de "if" pra aguentar até saltos grandes (ex: clicar
    // numa imagem bem na ponta)
    const corrigirLoop = () => {
        const margemSegura = itensOriginaisQtd; // um bloco inteiro de buffer em cada ponta
        let mudou = false;

        while (indiceAtual >= itens.length - margemSegura) {
            indiceAtual -= itensOriginaisQtd;
            mudou = true;
        }
        while (indiceAtual < margemSegura) {
            indiceAtual += itensOriginaisQtd;
            mudou = true;
        }

        if (!mudou) {
            travado = false;
            return;
        }

        track.style.transition = 'none';
        itens.forEach((item) => { item.style.transition = 'none'; });

        aplicarEfeitoLeque();
        centralizarPeloIndice();

        // força reflow antes de reativar a transição, senão o navegador
        // "funde" essa mudança instantânea com a próxima animada
        void track.offsetWidth;

        track.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`;
        itens.forEach((item) => { item.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`; });

        travado = false;
    };

    const mover = (direcao) => {
        irParaIndice(indiceAtual + direcao);
    };

    const irParaIndice = (novoIndice) => {
        if (travado || novoIndice === indiceAtual) return;
        travado = true;

        indiceAtual = novoIndice;
        aplicarEfeitoLeque();
        centralizarPeloIndice();

        clearTimeout(carrossel._loopTimeout);
        carrossel._loopTimeout = setTimeout(corrigirLoop, DURACAO_TRANSICAO + 30);

        // reinicia o autoplay a partir da interação do usuário
        iniciarRotacao();
    };

    const iniciarRotacao = () => {
        clearInterval(temporizadorAutomatico);
        temporizadorAutomatico = setInterval(() => mover(1), INTERVALO_AUTO);
    };

    botaoDireita.addEventListener('click', () => mover(1));
    botaoEsquerda.addEventListener('click', () => mover(-1));

    // clicar em qualquer imagem faz ela virar a imagem em destaque
    itens.forEach((item, idx) => {
        item.style.cursor = 'pointer';
        item.style.pointerEvents = 'auto';
        item.addEventListener('click', () => irParaIndice(idx));
    });

    carrossel.addEventListener('mouseenter', () => clearInterval(temporizadorAutomatico));
    carrossel.addEventListener('mouseleave', iniciarRotacao);

    window.addEventListener('resize', () => {
        track.style.transition = 'none';
        centralizarPeloIndice();
        void track.offsetWidth;
        track.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`;
    });

    // estado inicial, sem transição
    track.style.transition = 'none';
    itens.forEach((item) => { item.style.transition = 'none'; });
    aplicarEfeitoLeque();
    centralizarPeloIndice();
    void track.offsetWidth;
    track.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`;
    itens.forEach((item) => { item.style.transition = `transform ${DURACAO_TRANSICAO}ms ease`; });

    iniciarRotacao();
}