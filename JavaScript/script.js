// Configuração: Se você usa um backend, a URL é o BASE_URL. 
// A API_KEY real deve ficar protegida no seu servidor (Render).
const PROXY_URL = "https://youtube-planner.onrender.com"; 
const inputVideos = document.getElementById('searchVideos');
const buttonVideos = document.getElementById('btn-search');

// ── Highlight today's day cell ────────────────────────────
function destacarDiaHoje() {
  const hoje = new Date().getDay(); 
  const indice = hoje === 0 ? 6 : hoje - 1;
  const cell = document.getElementById(`cell-${indice}`);
  if (cell) cell.classList.add('today');
}

// ── Loading state on button ───────────────────────────────
function setLoading(isLoading) {
  if (isLoading) {
    buttonVideos.disabled = true;
    buttonVideos.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinner" style="animation: spin 0.65s linear infinite; display:block;">
        <path d="M12 2a10 10 0 0 1 10 10"/>
      </svg>
      Buscando…`;
  } else {
    buttonVideos.disabled = false;
    buttonVideos.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      Pesquisar`;
  }
}

// ── Chamada para o seu Backend ─────────────────────────────
async function buscarDados(termo) {
  // Faz a requisição para o seu servidor no Render
  // O seu servidor deve ser responsável por bater na API do YouTube e retornar os vídeos
  const resposta = await fetch(`${PROXY_URL}/api/videos?q=${encodeURIComponent(termo)}`);
  
  if (!resposta.ok) {
    throw new Error('Erro na resposta do servidor');
  }
  
  return await resposta.json(); 
}

// ── Conversão de Duração (ISO 8601 para Minutos) ──────────
function converterDuracoes(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const horas = parseInt(match[1] || 0);
  const minutos = parseInt(match[2] || 0);
  const segundos = parseInt(match[3] || 0);
  return horas * 60 + minutos + Math.ceil(segundos / 60);
}

// ── Erros ──────────────────────────────────────────────────
function mostrarErro(msg) {
  const banner = document.getElementById('error-banner');
  const txt = document.getElementById('error-message');
  if (banner && txt) {
    txt.textContent = msg || 'Ocorreu um erro.';
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 6000);
  }
}

// ── Favoritos ──────────────────────────────────────────────
function getFavoritos() {
  return JSON.parse(localStorage.getItem('favoritosSalvos')) || [];
}

function toggleFavorito(video) {
  const favoritos = getFavoritos();
  const id = video.id.videoId || video.id;
  const index = favoritos.findIndex(f => (f.id.videoId || f.id) === id);

  if (index === -1) {
    favoritos.push(video);
  } else {
    favoritos.splice(index, 1);
  }

  localStorage.setItem('favoritosSalvos', JSON.stringify(favoritos));
  renderFavoritos();
}

// ── Renderização ──────────────────────────────────────────
function criarCardVideo(video, i) {
  const favoritos = getFavoritos();
  const id = video.id.videoId || video.id;
  const isFav = favoritos.some(f => (f.id.videoId || f.id) === id);

  const wrapper = document.createElement('div');
  wrapper.className = 'video-item-wrapper';
  wrapper.style.animationDelay = `${Math.min(i * 0.04, 0.4)}s`;

  const thumbUrl = video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.medium?.url || '';
  const durMin = video.duracao ?? 0;
  const durLabel = durMin >= 60 ? `${Math.floor(durMin / 60)}h ${durMin % 60}min` : `${durMin} min`;

  wrapper.innerHTML = `
    <div class="video-item">
      <span class="video-order">#${i + 1}</span>
      <div class="video-thumb">
        <img src="${thumbUrl}" alt="Thumb" loading="lazy" />
      </div>
      <div class="video-info">
        <h3>${video.snippet.title}</h3>
        <p>${video.snippet.description || 'Sem descrição.'}</p>
        <div class="video-meta">
          <span class="meta-badge duration">⏱ ${durLabel}</span>
          <span class="meta-badge channel">${video.snippet.channelTitle}</span>
        </div>
      </div>
      <a href="https://www.youtube.com/watch?v=${id}" target="_blank" class="link-overlay"></a>
    </div>
    <button class="btn-favorito ${isFav ? 'ativo' : ''}">
      ${isFav ? '❤️' : '🤍'}
    </button>`;

  wrapper.querySelector('.btn-favorito').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorito(video);
  });

  return wrapper;
}

function aparecerLista(videos) {
  const dashboardVideo = document.getElementById('result-area');
  const container = document.getElementById('container');

  if (dashboardVideo) dashboardVideo.classList.remove('hidden');
  if (!container) return;

  container.innerHTML = '';

  if (videos.length === 0) {
    container.innerHTML = `<p class="empty-msg">Nenhum vídeo compatível com seu tempo hoje.</p>`;
    return;
  }

  videos.forEach((video, i) => {
    container.appendChild(criarCardVideo(video, i));
  });
}

function renderFavoritos() {
  const favoritos = getFavoritos();
  const section = document.getElementById('favoritos-section');
  const container = document.getElementById('favoritos-container');
  const count = document.getElementById('favoritos-count');

  if (!section || !container) return;

  if (favoritos.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  if (count) count.textContent = favoritos.length;
  container.innerHTML = '';
  favoritos.forEach((video, i) => {
    container.appendChild(criarCardVideo(video, i));
  });
}

// ── Filtros e Lógica de Tempo ─────────────────────────────
function obterIdDiaAtual() {
  const hoje = new Date().getDay();
  return hoje === 0 ? "day-6" : `day-${hoje - 1}`;
}

function filtrarVideos() {
  const idDia = obterIdDiaAtual();
  const inputDia = document.getElementById(idDia);
  const tempoDisponivel = parseInt(inputDia?.value) || 0;

  const todosVideos = JSON.parse(localStorage.getItem('videosSalvos')) || [];

  const videosFiltrados = tempoDisponivel === 0
    ? todosVideos 
    : todosVideos.filter(v => v.duracao > 0 && v.duracao <= tempoDisponivel);

  aparecerLista(videosFiltrados);
}

// ── Event Listeners ───────────────────────────────────────
document.querySelectorAll(".day-cell input").forEach(input => {
  input.addEventListener('input', () => {
    localStorage.setItem(input.id, input.value);
    filtrarVideos();
  });
});

inputVideos.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') buttonVideos.click();
});

buttonVideos.addEventListener("click", async () => {
  const termo = inputVideos.value.trim();
  if (!termo) return;

  setLoading(true);
  try {
    // Busca os dados do seu Backend (que já deve devolver a duração calculada)
    const videos = await buscarDados(termo);
    
    // Se o seu backend não devolver a duração, você teria que fazer outro fetch aqui.
    // Mas o ideal é que o backend já envie o objeto pronto: { ..., duracao: 15 }
    
    localStorage.setItem('videosSalvos', JSON.stringify(videos));
    filtrarVideos();
  } catch (err) {
    console.error(err);
    mostrarErro('Erro ao buscar vídeos. Verifique sua conexão ou o servidor.');
  } finally {
    setLoading(false);
  }
});

// ── Inicialização ──────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  destacarDiaHoje();

  document.querySelectorAll(".day-cell input").forEach(input => {
    const valorSalvo = localStorage.getItem(input.id);
    if (valorSalvo) input.value = valorSalvo;
  });

  if (localStorage.getItem("videosSalvos")) {
    filtrarVideos();
  }

  renderFavoritos();
});