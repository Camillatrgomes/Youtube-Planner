require('dotenv').config()

const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()

// CORS deve ser configurado ANTES das rotas
app.use(cors({
    origin: 'https://youtube-planner-sooty.vercel.app/'
}))

app.use(express.json())

const PORT = process.env.PORT || 3000

app.get('/api/dados', async (req, res) => {
    const { termo } = req.query

    if (!termo) {
        return res.status(400).json({ error: 'Parâmetro "termo" é obrigatório' })
    }

    try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
            params: {
                part: 'snippet',
                q: termo,
                maxResults: 50,
                type: 'video',
                key: process.env.MINHA_API_KEY
            }
        })

        res.json(response.data)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Erro ao buscar vídeos' })
    }
})

// app.listen FORA do handler da rota
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})