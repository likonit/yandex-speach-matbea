const express = require("express"), app = express(), request = require('request'),
    fs = require('fs'), querystring = require("querystring"), path = require("path")

var currData = {
}

const procent = 1-0.01005025125628141,
    procent2 = 0.99

function setAudio(text) {

    return new Promise(response => {

        var arr = ["0", "1", "2", "3", "a", "b", "c", "d", "e", "f", "g", "h", "j"],
            name = ""

        arr.map(() => name += arr[Math.floor(Math.random() * (arr.length-1))])

        var form = {
            text: text, 
            lang: "ru-RU",
            sampleRateHertz: 48000
        },
            formData = querystring.stringify(form)
        var contentLength = formData.length
        
        request({
            headers: {
                'Content-Length': contentLength,
                'Authorization': 'MY_API',
            },
            uri: 'https://tts.api.cloud.yandex.net/speech/v1/tts:synthesize',
            body: formData,
            method: 'POST',
            encoding: null
        }, function(err, res) {
                
                fs.writeFileSync(`static/music/${name}.ogg`, res.body)
                response(name)
        
            }
        
        )

    })

}

function getCurse(type) {

    return new Promise(resolve => {
        
        request("https://api.coincap.io/v2/assets/"+type, (err, res) => {

            resolve(JSON.parse(res.body))

        })

    })

}

function getTextBalance(name, type, obj) {

    return new Promise(res => {

        getCurse(type).then((d) => {

            var newPrice = (+d.data.priceUsd*procent2*procent).toFixed(1),
                oldPrice = (obj.price*procent),
                procentOldWin = ((newPrice-oldPrice) / oldPrice),
                lastProcent = (newPrice-obj.last) / obj.last * 100
    
            var text = ""
            text += `Курс продажи ${name}: ${newPrice}. ${
                (procentOldWin * 100).toFixed(2)
            }% от стартового вложения. `

            if (obj.last != 0) text += `${function() {
                
                if (lastProcent > 0) return `Поднялся на ${lastProcent.toFixed(2).toString()} %`
                if (lastProcent < 0) return `Упал на ${lastProcent.toFixed(2).toString()} %`
                if (lastProcent == 0) return `Не изменился`

            }()}`+ " с предыдущей проверки. "
            obj.last = newPrice

            if (obj.money*procentOldWin <= 0) text += `Если продашь, то потеряешь ${Math.abs((obj.money*procentOldWin).toFixed(2))} баксов.`
            if (obj.money*procentOldWin > 0) text += `Будешь рич бич и заработаешь ${Math.abs((obj.money*procentOldWin).toFixed(2))} баксов.`
    
            res(text)
    
        })

    })

}

function listOfText(functions) {

    var lengthOf = 0, Text = ""

    return new Promise(res => {

        functions.map(item => {

            item.func(...item.args).then((text) => {

                Text += text
                lengthOf++
                if (lengthOf == functions.length) res(Text)

            })

        })

    })

}

app.use(express.static(path.join(__dirname, "static")))
app.set('etag', false)

app.listen(3000, () => {

    app.get('/', (req, res) => {

        res.sendFile("./static/index.html")
        res.end()

    })

    app.post('/aud', (req, res) => {

        listOfText([
            {func: getTextBalance, args: ["ЛУНЫЫЫ", "terra-luna", currData.luna]}
        ]).then(Text => {

            setAudio(Text).then(name => {

                res.end(name)
    
            })

        })

    })

    app.get('/del', (req, res) => {

        fs.unlinkSync("static/music/"+req.query.name+'.ogg')
        res.end("ok")

    })

})