const {WebSocket} = require("ws")
const Jimp = require('jimp');

const DEFAULT_SERVER = "wss://server.rplace.tk:443"
const DEFAULT_BOARD = "https:\/\/raw.githubusercontent.com/rplacetk/canvas1/main/place"
const PALETTE = [0xff1a006d, 0xff3900be, 0xff0045ff, 0xff00a8ff, 0xff35d6ff, 0xffb8f8ff, 0xff68a300, 0xff78cc00, 0xff56ed7e, 0xff6f7500, 0xffaa9e00, 0xffc0cc00, 0xffa45024, 0xffea9036, 0xfff4e951, 0xffc13a49, 0xffff5c6a, 0xffffb394, 0xff9f1e81, 0xffc04ab4, 0xffffabe4, 0xff7f10de, 0xff8138ff, 0xffaa99ff, 0xff2f486d, 0xff26699c, 0xff70b4ff, 0xff000000, 0xff525251, 0xff908d89, 0xffd9d7d4, 0xffffffff]
.map((colour, i) =>
    [colour & 255, (colour >> 8) & 255, (colour >> 16) & 255])

function toArrayBuffer(buffer) {
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < buffer.length; ++i) {
      view[i] = buffer[i];
    }
    return arrayBuffer;
}

// function mostSimilarElement(arr, element){
//     let record = 0
//     let recordValue = Infinity
//     for(let i in arr){
//         let elem = arr[i]
//         let dif = numbersDifference(elem, element)
//         if(dif < recordValue){
//             recordValue = dif
//             record = i
//         }
//     }
//     return record
// }
function numbersDifference(num1, num2){
    return Math.abs(num1 - num2)
}

distance = function(v1, v2){
    var i,
        d = 0;

    for (i = 0; i < v1.length; i++) {
        d += (v1[i] - v2[i])*(v1[i] - v2[i]);
    }
    return Math.sqrt(d);
}


function theMostSimilarArray(main_arr, arrs){

    
    let record;
    let recordValue = Infinity;
    for(let i = 0; i < arrs.length; i++){
        let cur_diff = distance(arrs[i], main_arr)
        if(cur_diff < recordValue){
            record = i
            recordValue = cur_diff
        }
    }
    return record
}


class Bot{
    #seti(i, b) {
        this.board[i] = b
    }

    getPixel(x, y){
        return this.board[x % 1000 + (y % 1000) * 1000]
    }

    #runLengthChanges(data, buffer) {
        let i = 9,
        boardI = 0
        this.board = new Uint8Array(buffer)
        while (i < data.byteLength) {
            let cell = data.getUint8(i++)
            let c = cell >> 6
            if (c == 1) c = data.getUint8(i++)
            else if (c == 2) c = data.getUint16(i++), i++
            else if (c == 3) c = data.getUint32(i++), i += 3
            boardI += c
            this.board[boardI++] = cell & 63
        }
    }

    #onmessage({data}){
        data = new DataView(toArrayBuffer(data))
        let msgtype = data.getUint8(0)
        switch (msgtype) {
            // case 1:
            //     console.log("Got some client info")
            //     let width = data.getUint32(9)
            //     let height = data.getUint32(13)
            //     console.log(width, height)
            //         //setSize(width, height)
            //         //runLengthDecodeBoard(this.preloadedBoard, width * height)
            //     break
            case 2:
                this.#runLengthChanges(data, this.preloadedBoard)
                this.ws.onloading()
                break

            case 5:
                let i = 1
                while (i < data.byteLength) {
                    let position = data.getUint32(i); i += 4
                    let color = data.getUint8(i)
                    this.#seti(position, color); i += 1
                    i += 4
                }
                break
        }
    }
    #fetchBoard() {
        return new Promise(async (r)=>{
            const response = await fetch(DEFAULT_BOARD)
            response.arrayBuffer().then((data)=>{
                this.preloadedBoard = data
            })
        })
    }

    constructor(){
        this.ws = new WebSocket(DEFAULT_SERVER, {headers: {
            Origin: "https://rplace.live",
        }})
        this.queueSelectType = "last"
        this.setPixelQueue = []
        this.preloadedBoard = this.board = new Uint8Array(1000 * 1000).fill(255)
        this.#fetchBoard().then(()=>{
            console.log("Board fetched!")
        })
        this.ws.onmessage = this.#onmessage.bind(this)
        this.ws.onopen = this.#onLogin.bind(this)
        this.ws.onloading = this.#onLoading.bind(this)
    }

    onLoading(func){
        this.ws.onloading = ()=>{
            this.#onLoading()
            func()
        }
    }

    #onLoading(){

    }

    #onLogin(){
        setInterval(()=>{
            let i
            let px
            let run = true
            while(run){
                if(this.queueSelectType == "last"){
                    i = this.setPixelQueue.pop()
                }else if(this.queueSelectType == "random"){
                    let index = Math.floor(Math.random()*this.setPixelQueue.length)
                    i = this.setPixelQueue.at(index)
                    this.setPixelQueue.splice(index, 1)
                }
                if(i != undefined){
                    px = this.getPixel(i[0], i[1])
                    if(px != i[2]) {
                        run = false
                    } else continue
                    this.#setPixel(i[0], i[1], i[2])
                } else {
                    break
                }
            }
        }, 1000)
    }

    onLogin(func){
        this.ws.onopen = (_)=>{
            this.#onLogin()
            func()
        }
        console.log(this)
    }

    addPixelToQueue(x, y, color){
        this.setPixelQueue.push([x, y, color])
    }

    #setPixel(x, y, color){
        let pixelView = new DataView(new Uint8Array(6).buffer)
        pixelView.setUint8(0, 4)
        pixelView.setUint32(1, Math.floor(x) + Math.floor(y) * 1000)
        pixelView.setUint8(5, color)
        btoa.call.bind(btoa.call)(WebSocket.prototype.send, this.ws, pixelView)
    }

    onClose(func){
        this.ws.onclose = func
    }

}

// async function fetchBoard() {
//     const response = await fetch("https:\/\/raw.githubusercontent.com/rplacetk/canvas1/main/place")
//     if (!response.ok) {
//         showLoadingScreen()
//         fetchFailTimeout = setTimeout(fetchBoard, fetchCooldown *= 2)
//         if (fetchCooldown > 8000) {
//             loadingScreen.children[0].src = "images/rplace-offline.png"
//             clearTimeout(fetchFailTimeout)
//         }

//         return null
//     }

//     if (fetchFailTimeout != -1) clearTimeout(fetchFailTimeout)
//     return await response.arrayBuffer()
// }

class Drawer{
    /**
     * @param {Bot} bot 
     */
    constructor(bot){
        /** @type {Bot}*/
        this.bot = bot
    }

    drawArray(arr){
        for(let i of arr){
            this.bot.addPixelToQueue(i[0], i[1], i[2])
        }
    }

    getArrFromPng(w, h, startX, startY, url){
    return new Promise((r)=>{
            let f = function (err, image) {
                let result = []

                if(err) console.error(err)
                console.log(image.bitmap.width)
                image.resize(w, h, "^").brightness(-0.6)
                //let ignore_color = Jimp.intToRGBA(image.getPixelColor(0, 0)) 
                for(let x = 0; x < image.bitmap.width; x ++){
                    for(let y = 0; y < image.bitmap.height; y++){
                        let px = Jimp.intToRGBA(image.getPixelColor(x, y))
                        //if(Math.floor(px.r/pass_coef) == Math.floor(ignore_color.r/pass_coef) && Math.floor(px.b/pass_coef) == Math.floor(ignore_color.b/pass_coef) && Math.floor(px.g/pass_coef) == Math.floor(ignore_color.g/pass_coef)) continue
                        px = [px.r, px.g, px.b]
                        let similarIndex = theMostSimilarArray(px, PALETTE)
                        result.push([x + startX, y + startY, similarIndex]) 
                    }
                }
                r(result)
            }

            Jimp.read(url, f.bind(this));
        })
    }


    drawPng(w, h, startX, startY, url){
        new Promise((r)=>{
            //const pass_coef = 1
            let f = function (err, image) {
                if(err) console.error(err)
                console.log(image.bitmap.width)
                image.resize(w, h, "^")
                //let ignore_color = Jimp.intToRGBA(image.getPixelColor(0, 0)) 
                for(let x = 0; x < image.bitmap.width; x ++){
                    for(let y = 0; y < image.bitmap.height; y++){
                        let px = Jimp.intToRGBA(image.getPixelColor(x, y))
                        //if(Math.floor(px.r/pass_coef) == Math.floor(ignore_color.r/pass_coef) && Math.floor(px.b/pass_coef) == Math.floor(ignore_color.b/pass_coef) && Math.floor(px.g/pass_coef) == Math.floor(ignore_color.g/pass_coef)) continue
                        px = [px.r, px.g, px.b]
                        let similarIndex = theMostSimilarArray(px, PALETTE)
                        this.bot.addPixelToQueue(x + startX, y + startY, similarIndex) 
                    }
                }
                r()
            }

            Jimp.read(url, f.bind(this));
        })
    }
}

exports.Bot = Bot
exports.Drawer = Drawer