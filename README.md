## Sobre o projeto

Aplicação desenvolvida em JavaScript que permite ao usuário planejar quais vídeos do YouTube assistir com base no tempo disponível em cada dia da semana.

O sistema realiza buscas na API do YouTube, obtém a duração dos vídeos, calcula em quantos dias eles poderão ser assistidos seguindo regras específicas de tempo e exibe as 5 palavras mais frequentes encontradas nos títulos e descrições.

---

## Funcionalidades

* Busca de vídeos por palavra-chave.
* Consulta de duração dos vídeos utilizando a YouTube Data API.
* Planejamento automático dos vídeos conforme o tempo disponível.
* Ignora vídeos maiores que o maior tempo diário informado.
* Identifica as 5 palavras mais frequentes dos resultados.

---

## Conceitos de JavaScript Utilizados

* **Async/Await** para requisições assíncronas.
* **Promises** e `Promise.all()` para processamento paralelo.
* **Fetch API** para consumo da API do YouTube.
* **Arrow Functions** para funções mais concisas.
* **Template Literals** para construção dinâmica de URLs.
* **Métodos de Arrays** (`map`, `filter`, `sort`, `forEach`).
* **Spread Operator** (`...`) para manipulação de coleções.
* **Regex** para conversão das durações retornadas pela API.

---

## Tecnologias

* HTML5
* CSS3
* JavaScript (ES6+)
* YouTube Data API v3

---

## Objetivo

Praticar consumo de APIs REST, programação assíncrona e conceitos avançados de JavaScript através de uma aplicação com regras de negócio e processamento de dados.
