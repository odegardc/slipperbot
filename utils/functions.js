const { spawn } = require("child_process");
const { timeStamp } = require("console");

const slippyPhrases = [
    "soon", "ina bit", "in a bit", "few mins", "min", "later", "be on later", "be back later", "1sec", "1 sec"
]
const relativeRegex = /\b(\d{1,3})\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)?\b/;
const absoluteRegex = /\bat\s+(\d{1,2})(?:(?::|\s)(\d{2}))?(?:ish)?\b/i;

function parseSlippyTime(content, messageTimestamp) {
    content = content.toLowerCase();

    // Absolute Slippy Time
    const absoluteMatch = absoluteRegex.exec(content);
    if (absoluteMatch) {
        const hour = parseInt(absoluteMatch[1]);
        const minute = parseInt(absoluteMatch[2])

        return { type: 'absolute', hour: hour, minute: minute, timeStamp: messageTimestamp };
    }

    // Relative Slippy Time
    const relativeMatch = relativeRegex.exec(content);
    if (relativeMatch) {
        const number = parseInt(relativeMatch[1]);
        const rawUnit = relativeMatch[2]?.toLowerCase() || 'minutes';

        let unit = 'minutes';
        if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(rawUnit)) unit = 'hours';

        return { type: 'relative', number, unit, timeStamp: messageTimestamp };
    }

    // Vauge Slippy Time
    // Vague Slippy Time
    for (const phrase of slippyPhrases) {
        if (content.includes(phrase)) {
            return { type: "vague", phrase, timeStamp: messageTimestamp };
        }
    }
    return;
}
// Caller function for updateSlippyDB
async function callUpdateSlippyDB(slippyInstance) {
    try {
        const result = await updateSlippyDB(slippyInstance);
        console.log("Python result:", result)
    } catch (error) {
        console.error("Failed to update Slippy DB:", error);
    }
}

/*
1 = Add to Database


*/
function updateSlippyDB(slippyInstance) {
    return new Promise((resolve, reject) => {
        const py = spawn("python", ["utils//dbController.py", "1", JSON.stringify(slippyInstance)]);
        console.log("Sending to Python:", slippyInstance);
        let output = "";

        py.stdout.on("data", data => {
            output += data;
        })

        py.on("close", (code) => {
            if (code !== 0) {
                reject(`Python exited with code ${code}`);
            } else {
                resolve(output.trim()); // Python output
            }
        });
    });
}

module.exports = {
    parseSlippyTime, updateSlippyDB, callUpdateSlippyDB
};