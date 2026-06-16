require('dotenv').config()

const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 3000



app.get('./api/dados', async (req, res) => {
    try{
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(termo)}&maxResults=50&type=video&key=', {
            hearders:{
                'Authorization': `Bearer ${process.env.MINHA_API_KEY}`
            }
        })

        res.json(response.data)
    } catch(error){
        console.error(error)
        res.status(500).json({error: 'erro ao buscar vídeos'})
    }
    })
    app.listen(PORT, () => {
        console.log(`Servidor rodando em http://localhost:${PORT}`)

    })

    app.use(cors({
        origin: 'https://youtube-planner-sooty.vercel.app/'
    }))