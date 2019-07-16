const fs = require('fs');
const Jimp = require('jimp');
const bot_util = require('bot-util');
const express = require('express');
const getEmoji = require('./getEmoji');

let app = express();

const ID = ''; /* the page id */

const TOKEN = process.env.FB_TOKEN;

//epic gamer variable
const useDiversity = false;

let tmp = '/tmp/';

let getFileNames = size => {
    return new Promise((resolve, reject) => {
        fs.readdir(`emojis/${size}/`, (err, folders) => {
            if (err) reject(err);
            let files = [];
            folders.forEach((folder, i) => {
                if (folder != 'diversity') { //should use useDiversity here
                    let emojis = fs.readdirSync(`emojis/${size}/${folder}/`);
                    let objs = [];
                    emojis.forEach(emoji => {
                        objs.push({
                            filename: emoji,
                            fullpath: `emojis/${size}/${folder}/${emoji}`
                        });
                    });
                    files = objs.concat(files);
                }
                if (i == folders.length - 1) resolve(files);
            });
        });
    });
}

let util = bot_util.facebook;
util.AddPage(ID, TOKEN).then(id => {
    util.pages[id].SchedulePost('0 0 * * * *', () => {
        return new Promise((resolve, reject) => {
            generateImage().then(obj => {
                resolve({
                    type: 'image',
                    source: tmp + 'output.png',
                    caption: obj.emojis,
                    onPosted: res => {
                        console.log(`posted. res-id: ${res.id}`);
                    },
                    comment: {
                        message: obj.caption + '\n\nFeeling extra generous today? support the botmin: https://ko-fi.com/andicreates'
                    }
                })
            });
        });
    })
});
let generateImage = () => {
    return new Promise(async(resolve, reject) => {
        let files = JSON.parse(fs.readFileSync('files.json', 'utf8'));
        let numOfEmojis = 1 + Math.floor(Math.random() * 5)
        let emojis = [];
        for (let i = 0; i < numOfEmojis; i++) {
            let pickedEmoji = files[Math.floor(Math.random() * files.length)];
            emojis.push({
                fileName: pickedEmoji.fullpath,
                name: pickedEmoji.filename.formatEmojiName()
            });
        }
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
        let caption = '';
        let actualEmojis = '';
        emojis.forEach(emoji => {
            caption += ' ' + emoji.name;
            actualEmojis += getEmoji(emoji.name).char;
        });
        //😦
        caption = caption.replace(/niger/g, '[REDACTED]')

        Jimp.read(600, 450, Jimp.rgbaToInt(255, 255, 255, 255)).then(base => {
            let index = 0;
            base.print(font, 0, 260, { text: caption, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE }, 600);
            for (let i = 0; i < emojis.length; i++) {
                Jimp.read(emojis[i].fileName).then(emoji => {
                    emoji.scale(0.75, Jimp.BEZIER);
                    base.composite(emoji, (600 / 2 - (96 * emojis.length) / 2) + (i * 96), 145);
                    index++;
                    if (index == emojis.length) {
                        base.writeAsync(tmp + 'output.png').then(() => {
                            let obj = { emojis: actualEmojis, caption: caption };
                            resolve(obj);
                        });
                    }
                });
            }
        });
    });
}

let port = 3000 || process.env.port;
app.listen(port, () => {
    console.log('listening');
});