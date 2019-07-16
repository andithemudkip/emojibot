let emojis = require('emoji.json');

let stringSimilarity = require('string-similarity');

Object.defineProperty(String.prototype, 'formatEmojiName', {
    value() {
        return this.substring(0, this.length - 4).replace(/-/g, ' ');
    }
});

//this is pretty bad because it picks the first emoji that matches the criteria (> 75% accuracy)
//instead of the one that is most similar
let compare = stringSimilarity.compareTwoStrings;
emojis.hasEmoji = str => {
    let found = false;
    let foundEmoji = `[${str}]`;
    for(let i = 0; i < emojis.length; i++) {
        let emoji = emojis[i];
        emoji.name = emoji.name.toLowerCase().replace(/&/g, 'amp').replace(/-/g, ' ').replace(/\./g, '');
        if(emoji.name == str || emoji.name == `flag: ${str}` || compare(emoji.name, str) > 0.75 || compare(emoji.name, `flag: ${str}`) > 0.75) found = true
        if(!found) {
            let keywords = emoji.keywords.split(' | ');
            let nameArr = str.split(' ');
            let found2 = true;
            nameArr.forEach(np => {
                if(!keywords.includes(np)) {
                    let found3 = false;
                    keywords.forEach(keyword => {
                        if(compare(keyword, np) > .8) found3 = true;
                    });
                    found2 = found3;
                }
            })
            found = found2;
        }
        if(found) {
            foundEmoji = emoji;
            break;
        }
    }
    return foundEmoji;
}

module.exports = emojis.hasEmoji;