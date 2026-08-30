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
        track.style.willChange = 'transform';
        while (carrossel.firstChild) {
            track.appendChild(carrossel.firstChild);
        }
        carrossel.appendChild(track);
        carrossel.style.overflow = 'hidden';
    }

    const originalHTML = track.innerHTML;
    const originalWidth = track.scrollWidth;

    // duplica para a DIREITA até ter pelo menos 2x a largura original/tela
    while (track.scrollWidth < originalWidth * 2 || track.scrollWidth < window.innerWidth * 2) {
        track.innerHTML += originalHTML;
    }

    // agora duplica também para a ESQUERDA (mesma quantidade de blocos que já existem à direita)
    const blocosDireita = Math.round(track.scrollWidth / originalWidth);
    for (let i = 0; i < blocosDireita; i++) {
        track.innerHTML = originalHTML + track.innerHTML;
    }

    const singleBlockWidth = originalWidth;
    const itens = [...track.querySelectorAll('.item-carrossel')];

    // posição inicial: começa "no meio" do conteúdo duplicado,
    // exatamente no início de um bloco original, assim já existe
    // conteúdo pra esquerda E pra direita desde o primeiro frame
    let position = -singleBlockWidth * blocosDireita;
    track.style.transform = `translateX(${position}px)`;

    let speed = 0.5;
    let pausado = false;
    let emTransicaoManual = false;

    const atualizarDestaque = () => {
        const centro = carrossel.clientWidth / 2;
        let itemMaisProximo = itens[0];
        let menorDistancia = Infinity;

        itens.forEach((item) => {
            const rect = item.getBoundingClientRect();
            const carrosselRect = carrossel.getBoundingClientRect();
            const centroItem = rect.left - carrosselRect.left + rect.width / 2;
            const distancia = Math.abs(centroItem - centro);
            if (distancia < menorDistancia) {
                menorDistancia = distancia;
                itemMaisProximo = item;
            }
        });

        itens.forEach((item) => item.classList.toggle('ativa', item === itemMaisProximo));
    };

    // realinha a posição para dentro da "zona segura" no meio do conteúdo
    // duplicado, sem que isso seja perceptível (mesmo truque da fita)
    const realinhar = () => {
        const limite = singleBlockWidth * blocosDireita;
        if (position <= -limite - singleBlockWidth) {
            position += singleBlockWidth;
        } else if (position >= -limite + singleBlockWidth) {
            position -= singleBlockWidth;
        }
    };

    function animate() {
        if (!pausado && !emTransicaoManual) {
            position -= speed;
            realinhar();
            track.style.transform = `translateX(${position}px)`;
        }
        atualizarDestaque();
        requestAnimationFrame(animate);
    }

    animate();

    // clique: avança/recua visivelmente a largura média de um item,
    // com transição suave via CSS, e depois volta pro modo automático
    const larguraMediaItem = () => {
        const primeiro = itens[0];
        return primeiro.getBoundingClientRect().width;
    };

    const moverManual = (direcao) => {
        emTransicaoManual = true;
        pausado = true;

        const passo = larguraMediaItem() + 16; // ajuste 16 conforme o gap/margin dos seus itens
        position -= direcao * passo;

        track.style.transition = 'transform 0.4s ease';
        track.style.transform = `translateX(${position}px)`;

        clearTimeout(carrossel._manualTimeout);
        carrossel._manualTimeout = setTimeout(() => {
            track.style.transition = 'none';
            realinhar();
            track.style.transform = `translateX(${position}px)`;
            emTransicaoManual = false;
            pausado = false;
        }, 400);
    };

    botaoDireita.addEventListener('click', () => moverManual(1));
    botaoEsquerda.addEventListener('click', () => moverManual(-1));

    carrossel.addEventListener('mouseenter', () => { pausado = true; });
    carrossel.addEventListener('mouseleave', () => {
        if (!emTransicaoManual) pausado = false;
    });
}