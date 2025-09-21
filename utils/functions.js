const slippyPhrases = [
    "soon", "ina bit", "in a bit", "few mins", "min", "later", "be on later", "be back later", "1sec", "1 sec"
]

function parseSlippyTime(content){
    content = content.toLowerCase();
    for (const phrase of slippyPhrases){
        if(content.includes(phrase)) return {type: "vague", phrase};
    }
}

module.exports = {
  parseSlippyTime
};