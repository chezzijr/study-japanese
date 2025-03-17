// Generate kanji definitions from the kanji file
// The kanji file is a json, which is an arra of kanji characters
// For example: ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]
import fs from 'fs';

type KanjiJotoba = {
    literal: string,
    meanings: string[],
    grade: number,
    stroke_count: number,
    frequency: number, // out of 2500
    jlpt: number,
    onyomi: string[],
    kunyomi: string[],
    chinese: string[],
    korean_r: string[],
    korean_h: string[],
    parts: string[],
    radicals: string,
    stroke_frames: string[]
}

type KanjiResponse = {
    "kanji": KanjiJotoba[],
}

// we dont need all fields of KanjiJotoba, so we will only use some of them
const filterKeys = ["meanings", "grade", "stroke_count", "frequency", "onyomi", "kunyomi", "parts", "radicals"];
function filterObs(obj, keys) {
    return keys.reduce((acc, key) => {
        acc[key] = obj[key];
        return acc;
    }, {})
}

const kanjiFiles = fs.readdirSync('./src/lib/kanji/');
// filter out _def.json files
const kanjiFilesFiltered = kanjiFiles.filter(file => !file.includes('_def.json'));
const kanjiJsons = kanjiFilesFiltered.reduce((acc, file) => {
    const buffer = fs.readFileSync(`./src/lib/kanji/${file}`);
    const data = JSON.parse(buffer.toString());
    acc[file] = data;
    return acc;
}, {})

Object.entries(kanjiJsons).forEach(([file, kanjis]: any) => {
    console.log(`Processing file ${file}...`)
    // check if file is already generated
    const outputFile = `./src/lib/kanji/${file.replace('.json', '_def.json')}`;
    // if (fs.existsSync(outputFile)) {
    //     console.log(`File ${outputFile} already exists, skipping...`);
    //     return;
    // }

    console.log(`Fetching kanji definitions for ${file}...`);
    const promises = kanjis.map((kanji: string) => {
        const url = `https://jotoba.de/api/search/kanji`
        const body = {
            query: kanji,
            language: "English",
            no_english: false
        }
        return fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        })
    })

    // resolve all promise, abort if any error, log which one
    Promise.all(promises)
        .then((responses) => {
            return Promise.all(responses.map(res => res.json()))
        })
        .then((kanjiDefs: KanjiResponse[]) => {
            const kanjiDefsMap = kanjiDefs.reduce((acc, kanjiDef) => {
                acc[kanjiDef.kanji[0].literal] = filterObs(kanjiDef.kanji[0], filterKeys);
                return acc;
            }, {})

            // write to file
            console.log(`Writing to file ${outputFile}...`);
            fs.writeFileSync(outputFile, JSON.stringify(kanjiDefsMap, null, 2));
        })
        .catch(err => {
            console.error(err);
        })
})