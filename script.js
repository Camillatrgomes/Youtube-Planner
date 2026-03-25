
const API_KEY = "AIzaSyBTBc6OLgxIK3BfkMJsjKsK7DoysZ3j4DQ";
const inputVideos = document.getElementById ('searchVideos')
const buttonVideos = document.getElementById ('btn-search')

async function API(termo) {
const url =  `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${termo}&maxResults=50&type=video&key=${API_KEY}`

const resposta = await fetch (url);
const dados = await resposta.json();

console.log(dados.items)

if(dados.error){
  console.log("Erro no API do youtube:", dados.error.message)
  return[]
}
return dados.items || []
};


async function pegarDuracoes(videos) {
    console.log("O que recebi em videos:", videos);
  
  if (!Array.isArray(videos) || videos.length === 0) return [];


  const ids = videos
  .filter(v => v.id && v.id.videoId)
  .map(v =>  v.id.videoId)
  .join(',');

  const url = (`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids}&key=${API_KEY}`)
  const res = await fetch(url)
  const data = await res.json()

return data.items.map(item => converterDuracoes(item.contentDetails.duration));

  };

function converterDuracoes(iso){
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

  const horas = parseInt(match [1] || 0);
  const minutos = parseInt(match[2] || 0);
  const segundos = parseInt(match[3] || 0);

  return horas * 60 + minutos + Math.ceil(segundos / 60)
}


function aparecerLista(videos){
  const dashboardVideo = document.getElementById("result-area")
  const container = document.getElementById("container")
  const duracoesSalvas = JSON.parse(localStorage.getItem('duracoesVideos')) || [];

  dashboardVideo.classList.remove("hidden")

  if(container){
    container.innerHTML = "";

  videos.forEach((video, i) => {
    container.innerHTML += ` 
    <a class="video-item" href="https://youtube.com/watch?v=ID${video.id.videoId}" target="_blank" rel="noopener">
          <span class="video-order">#${i + 1}</span>
          <div class="video-thumb">
            <img src=${video.snippet.thumbnails.high.url} alt="Thumb do vídeo" loading="lazy" />
          </div>
          <div class="video-info">
            <h3>${video.snippet.title}</h3>
            <p>${video.snippet.description}</p>
            <div class="video-meta">
              <span class="meta-badge duration">${duracoesSalvas[i] || 0} minutos</span>
              <span class="meta-badge channel">${video.snippet.channelTitle}</span>
            </div>
          </div>
        </a>`
  });
  }
}

 function obterDiaAtual(){

  const hoje = new Date().getDay()

  if(hoje === 0) return "day-6";
  return `day-${hoje - 1}`
 }


function filtrarVideos(){
  const idDia = obterDiaAtual()
  const inputDia = document.getElementById(idDia)

  const tempoDisponivel = parseInt(inputDia.value) || 0;
  
  const todosVideos = JSON.parse(localStorage.getItem('videosSalvos')) || [];

  const videosFiltrados = tempoDisponivel === 0
  ? todosVideos
  : todosVideos.filter(video => video.duracao <= tempoDisponivel)
    aparecerLista(videosFiltrados)

}


  document.querySelectorAll(".day-cell input").forEach(input =>{
    input.addEventListener('input', () => {
            localStorage.setItem(input.id, input.value);
            filtrarVideos()

    })


  })


  buttonVideos.addEventListener("click", async () => {
  const termo = inputVideos.value;
  if(termo){
    const videos = await API(termo)
    const duracoes = await pegarDuracoes(videos)
    
    const videosDuracao = videos.map((video, i ) =>{
      return{...video, duracao: duracoes[i]}
    }) 

  localStorage.setItem('videosSalvos', JSON.stringify(videosDuracao));
  filtrarVideos()
} 

})

 window.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".day-cell input").forEach(input => {
    const valorSalvo = localStorage.getItem(input.id)
    if(valorSalvo != null) {
         input.value = valorSalvo; 
    }

  
  });
  
  const dadosStorage = localStorage.getItem("videosSalvos");

  if(dadosStorage){
      filtrarVideos();

  }
});





