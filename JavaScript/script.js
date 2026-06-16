
const API_KEY = "https://youtube-planner.onrender.com"; 
const inputVideos = document.getElementById('searchVideos');
const buttonVideos = document.getElementById('btn-search');

// ── Highlight today's day cell ────────────────────────────
function destacarDiaHoje() {
  const hoje = new Date().getDay(); // 0 = domingo
  // Mapeia: domingo (0) => cell-6, segunda (1) => cell-0, ... sábado (6) => cell-5
  const indice = hoje === 0 ? 6 : hoje - 1;
  const cell = document.getElementById(`cell-${indice}`);
  if (cell) cell.classList.add('today');
}

// ── Loading state on button ───────────────────────────────
function setLoading(isLoading) {
  if (isLoading) {
    buttonVideos.disabled = true;
    buttonVideos.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"
           style="animation: spin 0.65s linear infinite; display:block;">
        <path d="M12 2a10 10 0 0 1 10 10"/>
        <path d="M22 12a10 10 0 0 1-10 10"/>
        <path d="M12 22a10 10 0 0 1-10-10"/>
        <path d="M2 12a10 10 0 0 1 10-10"/>
      </svg>
      Buscando…`;
  } else {
    buttonVideos.disabled = false;
    buttonVideos.innerHTML = `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      Pesquisar`;
  }
}

async function buscarDados(termo) {
  try{
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(termo)}&maxResults=50&type=video&key=${API_KEY}`;

  const resposta = await fetch(`${API_KEY}/api/dados`);
  const dados = await resposta.json();

  } catch(error){
    console.error("erro ao carregar o video", erro)
  }
}


async function pegarDuracoes(videos) {
  if (!Array.isArray(videos) || videos.length === 0) return new Map();

  const ids = videos
    .filter(v => v.id && v.id.videoId)
    .map(v => v.id.videoId)
    .join(',');

  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  // Retorna um Map { videoId -> duracaoEmMinutos } para não depender da ordem da API
  const duracaoMap = new Map();
  (data.items || []).forEach(item => {
    duracaoMap.set(item.id, converterDuracoes(item.contentDetails.duration));
  });
  return duracaoMap;
}

function converterDuracoes(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  const horas = parseInt(match[1] || 0);
  const minutos = parseInt(match[2] || 0);
  const segundos = parseInt(match[3] || 0);

  return horas * 60 + minutos + Math.ceil(segundos / 60);
}

function mostrarErro(msg) {
  const banner = document.getElementById('error-banner');
  const txt = document.getElementById('error-message');
  if (banner && txt) {
    txt.textContent = msg || 'Ocorreu um erro.';
    banner.classList.remove('hidden');
    setTimeout(() => banner.classList.add('hidden'), 6000);
  }
}

function getFavoritos() {
  return JSON.parse(localStorage.getItem('favoritosSalvos')) || [];
}

function toggleFavorito(video) {
  const favoritos = getFavoritos();
  const id = video.id.videoId;
  const index = favoritos.findIndex(f => f.id.videoId === id);

  if (index === -1) {
    favoritos.push(video);
  } else {
    favoritos.splice(index, 1);
  }

  localStorage.setItem('favoritosSalvos', JSON.stringify(favoritos));
  renderFavoritos();
}

function criarCardVideo(video, i) {
  const favoritos = getFavoritos();
  const id = video.id.videoId;
  const isFav = favoritos.some(f => f.id.videoId === id);

  const wrapper = document.createElement('div');
  wrapper.className = 'video-item-wrapper';
  wrapper.style.animationDelay = `${Math.min(i * 0.04, 0.4)}s`;

  const thumbUrl = video.snippet?.thumbnails?.high?.url
    || video.snippet?.thumbnails?.medium?.url
    || video.snippet?.thumbnails?.default?.url
    || '';

  const durMin = video.duracao ?? 0;
  const durLabel = durMin >= 60
    ? `${Math.floor(durMin / 60)}h ${durMin % 60}min`
    : `${durMin} min`;

  wrapper.innerHTML = `
    <a class="video-item" href="https://youtube.com/watch?v=${id}" target="_blank" rel="noopener">
      <span class="video-order">#${i + 1}</span>
      <div class="video-thumb">
        ${thumbUrl
          ? `<img src="${thumbUrl}" alt="Miniatura do vídeo" loading="lazy" />`
          : `<div class="video-thumb-placeholder">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                 <path d="M10 8l6 4-6 4V8z"/>
               </svg>
             </div>`
        }
      </div>
      <div class="video-info">
        <h3>${video.snippet.title}</h3>
        <p>${video.snippet.description || 'Sem descrição disponível.'}</p>
        <div class="video-meta">
          <span class="meta-badge duration">⏱ ${durLabel}</span>
          <span class="meta-badge channel">${video.snippet.channelTitle}</span>
        </div>
      </div>
    </a>
    <button class="btn-favorito ${isFav ? 'ativo' : ''}" title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}" aria-label="Favoritar">
      ${isFav ? '❤️' : '🤍'}
    </button>`;

  wrapper.querySelector('.btn-favorito').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleFavorito(video);
    // Re-renderiza só o ícone desse botão
    const btn = wrapper.querySelector('.btn-favorito');
    const favoritosAtuais = getFavoritos();
    const agora = favoritosAtuais.some(f => f.id.videoId === id);
    btn.classList.toggle('ativo', agora);
    btn.textContent = agora ? '❤️' : '🤍';
    btn.title = agora ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  });

  return wrapper;
}

function aparecerLista(videos) {
  const dashboardVideo = document.getElementById('result-area');
  const container = document.getElementById('container');

  dashboardVideo.classList.remove('hidden');

  if (container) {
    container.innerHTML = '';

    if (videos.length === 0) {
      container.innerHTML = `
        <div class="state-placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <p>Nenhum vídeo encontrado para o tempo disponível hoje.</p>
        </div>`;
      return;
    }

    videos.forEach((video, i) => {
      container.appendChild(criarCardVideo(video, i));
    });
  }
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
  count.textContent = favoritos.length;
  container.innerHTML = '';
  favoritos.forEach((video, i) => {
    container.appendChild(criarCardVideo(video, i));
  });
}

function obterDiaAtual() {
  const hoje = new Date().getDay();
  if (hoje === 0) return "day-6";
  return `day-${hoje - 1}`;
}


function filtrarVideos() {
  const idDia = obterDiaAtual();
  const inputDia = document.getElementById(idDia);

  const tempoDisponivel = parseInt(inputDia.value) || 0;

  const todosVideos = JSON.parse(localStorage.getItem('videosSalvos')) || [];

  const videosFiltrados = tempoDisponivel === 0
    ? todosVideos.filter(video => video.duracao >= 3)
    : todosVideos.filter(video => video.duracao >= 2 && video.duracao <= tempoDisponivel);

  aparecerLista(videosFiltrados);
}


document.querySelectorAll(".day-cell input").forEach(input => {
  input.addEventListener('input', () => {
    localStorage.setItem(input.id, input.value);
    filtrarVideos();
  });
});

// Search on Enter key
inputVideos.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') buttonVideos.click();
});

buttonVideos.addEventListener("click", async () => {
  const termo = inputVideos.value.trim();
  if (!termo) return;

  // Clear previous error
  document.getElementById('error-banner')?.classList.add('hidden');

  setLoading(true);
  try {
    const videos = await API(termo);
    const duracaoMap = await pegarDuracoes(videos);

    // Usa o Map para buscar a duração pelo videoId — sem depender da ordem
    const videosDuracao = videos.map(video => {
      const id = video.id?.videoId;
      return { ...video, duracao: duracaoMap.get(id) ?? 0 };
    });

    localStorage.setItem('videosSalvos', JSON.stringify(videosDuracao));
    filtrarVideos();
  } catch (err) {
    console.error(err);
    mostrarErro('Falha ao conectar com a API. Tente novamente.');
  } finally {
    setLoading(false);
  }
});

// Scroll-to-top button
document.getElementById('btn-scroll-top')?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

window.addEventListener("DOMContentLoaded", function () {
  // Highlight today
  destacarDiaHoje();

  // Restore saved day values
  document.querySelectorAll(".day-cell input").forEach(input => {
    const valorSalvo = localStorage.getItem(input.id);
    if (valorSalvo != null) {
      input.value = valorSalvo;
    }
  });

  const dadosStorage = localStorage.getItem("videosSalvos");
  if (dadosStorage) {
    filtrarVideos();
  }

  renderFavoritos();
});
