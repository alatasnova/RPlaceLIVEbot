const {Bot, Drawer} = require("./bot")
const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}
// (async function(){
//     require("fs").writeFileSync("TEMPLATE.html", (await (require("axios").get("https://rplace.live/"))).data)
// }())

const bot = new Bot()
bot.queueSelectType = "random"

bot.onLoading(()=>{
    console.log("Connected to the server!")
    setInterval(()=>{
        bot.setPixelQueue = []
        for(let x = 0; x < 100; x ++){
            for(let y = 0; y < 100; y++){
                bot.addPixelToQueue(x, y, 27)
            }
        }
    }, 3000)
})

// let a = async function(){
//     require('fs').writeFile(

//         './IMAGE.json',
    
//         JSON.stringify(await drawer.getArrFromPng(20, 20, 0, 0, "./images/me.png")),
    
//         function (err) {
//             if (err) {
//                 console.error('Crap happens');
//             }
//         }
//     );
//     drawer.drawArray(await drawer.getArrFromPng(20, 20, 0, 0, "./images/me.png"))
// }
