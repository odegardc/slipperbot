const slippyPhrases = [
    "soon", "ina bit", "in a bit", "few mins", "min", "later", "be on later", "be back later", "1sec", "1 sec"
]
const relativeRegex = /\b(\d{1,3})\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?\b/;
const absoluteRegex = /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;

function parseSlippyTime(content){
    content = content.toLowerCase();

    // Vauge Slippy Time
    for (const phrase of slippyPhrases){
        if(content.includes(phrase)) return {type: "vague", phrase};
    }

    // Absolute Slippy Time
    

    // Relative Slippy Time
    relativeMatch = relativeRegex.exec(content);
    if(relativeMatch){
        const number = parseInt(match[1]);
        const rawUnit = relativeMatch[2]?.toLowerCase() || 'minutes';

        let unit = 'minutes';
        if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(rawUnit)) unit = 'hours';

        return { type: 'relative', number, unit };
    }

}

module.exports = {
  parseSlippyTime
};