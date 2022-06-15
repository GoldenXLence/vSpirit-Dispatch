import express from 'express'
import fs from 'fs'
import path from 'path'
import routes from './data/routes'
import getArrivalInfo from './getArrivalInfo'

import dotenv from 'dotenv'
dotenv.config()

if (!process.env.AVWX_TOKEN || !process.env.HOPPIE_LOGON || !process.env.CALLSIGN) {
    throw new Error("Missing environment variables")
}

import cron from './cron'
cron()

const port = process.env.PORT || 3000

const app = express();

app.all('/', (req, res) => {
    res
        .status(200)
        .json({
            message: 'Server Online'
        })
})

app.get('/dispatch/', (req, res) => {
    res
        .status(400)
        .json({
            message: 'Bad Request, no file specified'
        })
})

app.get('/dispatch/:file', async (req, res) => {
    const file = String(req.params.file)

    if (file.split('.').length != 2) {
        return res
            .status(400)
            .json({
                message: 'Bad Request, file must be a valid file'
            })
    }

    const flight = file.split('.')[0].toUpperCase()
    const requestType = file.split('.')[1].toUpperCase()
    const filePath = path.join(__dirname, './files/', file)
    const flightInfo = routes.find(route => route.callsign === flight)
    let text = []

    if (!flightInfo) {
        text.push(`Flight ${flight} not found`)
    } else {

        switch (requestType) {
            case 'TST': {
                text.push('Test Successful')
                break;
            }

            case 'ARV': {
                const arrivalText = await getArrivalInfo(flightInfo)
                arrivalText.forEach(line => {
                    text.push(line)
                });
            }
        }

    }


    if (process.env.FOOTER_LN1) text.push('\n')
    if (process.env.FOOTER_LN1) text.push(process.env.FOOTER_LN1)
    if (process.env.FOOTER_LN2) text.push(process.env.FOOTER_LN2)
    if (process.env.FOOTER_LN3) text.push(process.env.FOOTER_LN3)
    if (process.env.FOOTER_LN4) text.push(process.env.FOOTER_LN4)
    if (process.env.FOOTER_LN5) text.push(process.env.FOOTER_LN5)

    for (let i = 0; i < text.length; i++) {
        text[i] = text[i].toUpperCase()
    }

    fs.writeFileSync(filePath, text.join('\n'), { encoding: 'utf8', flag: 'w' })
    res
        .status(200)
        .sendFile(filePath)
})

app.all('*', (req, res) => {
    res
        .status(404)
        .json({
            message: 'Not found'
        })
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})