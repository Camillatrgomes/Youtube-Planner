
const API_KEY = "AIzaSyBTBc6OLgxIK3BfkMJsjKsK7DoysZ3j4DQ";
const inputVideos = document.getElementById('searchVideos')
const buttonVideos = document.getElementById('btn-search')

async function API(termo) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${termo}&maxResults=50&type=video&key=${API_KEY}`

  const resposta = await fetch(url);
  const dados = await resposta.json();

  console.log(dados.items)

  if (dados.error) {
    console.log("Erro no API do youtube:", dados.error.message)
    return []
  }
  return dados.items || []
};


async function pegarDuracoes(videos) {
  console.log("O que recebi em videos:", videos);

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
  data.items.forEach(item => {
    duracaoMap.set(item.id, converterDuracoes(item.contentDetails.duration));
  });
  return duracaoMap;

};

function converterDuracoes(iso) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  const horas = parseInt(match[1] || 0);
  const minutos = parseInt(match[2] || 0);
  const segundos = parseInt(match[3] || 0);

  return horas * 60 + minutos + Math.ceil(segundos / 60)
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
  wrapper.innerHTML = `
    <a class="video-item" href="https://youtube.com/watch?v=${id}" target="_blank" rel="noopener">
      <span class="video-order">#${i + 1}</span>
      <div class="video-thumb">
        <img src="${video.snippet.thumbnails.high.url}" alt="Thumb do vídeo" loading="lazy" />
      </div>
      <div class="video-info">
        <h3>${video.snippet.title}</h3>
        <p>${video.snippet.description}</p>
        <div class="video-meta">
          <span class="meta-badge duration">${video.duracao ?? 0} minutos</span>
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

  const hoje = new Date().getDay()

  if (hoje === 0) return "day-6";
  return `day-${hoje - 1}`
}


function filtrarVideos() {
  const idDia = obterDiaAtual()
  const inputDia = document.getElementById(idDia)

  const tempoDisponivel = parseInt(inputDia.value) || 0;

  const todosVideos = JSON.parse(localStorage.getItem('videosSalvos')) || [];

  const videosFiltrados = tempoDisponivel === 0
    ? todosVideos.filter(video => video.duracao >= 1)
    : todosVideos.filter(video => video.duracao >= 1 && video.duracao <= tempoDisponivel);
  aparecerLista(videosFiltrados);

}


document.querySelectorAll(".day-cell input").forEach(input => {
  input.addEventListener('input', () => {
    localStorage.setItem(input.id, input.value);
    filtrarVideos()

  })


})


buttonVideos.addEventListener("click", async () => {
  const termo = inputVideos.value;
  if (termo) {
    const videos = await API(termo);
    const duracaoMap = await pegarDuracoes(videos);

    // Usa o Map para buscar a duração pelo videoId — sem depender da ordem
    const videosDuracao = videos.map(video => {
      const id = video.id?.videoId;
      return { ...video, duracao: duracaoMap.get(id) ?? 0 };
    });

    localStorage.setItem('videosSalvos', JSON.stringify(videosDuracao));
    filtrarVideos();
  }
})

window.addEventListener("DOMContentLoaded", function () {
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





