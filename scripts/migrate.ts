import fs from 'fs'
import path from 'path'
const base = './src/lib/n5'
const newBase = './src/lib/n5v2'
fs.mkdirSync(newBase, { recursive: true })

function migrateToNewStructure() {
  const files = fs.readdirSync(base)
  files.forEach((file) => {
    const jsonString = fs.readFileSync(path.join(base, file)).toString()
    const obj = JSON.parse(jsonString)
    const arrayOfKotoba = Object.entries(obj).reduce((acc, [word, def]) => {
      const { pronunciation, vietnamese, note } = def as any;
      return [...acc, {
        word,
        reading: pronunciation,
        meaning: vietnamese,
        note,
      }]
    }, [] as any)
    fs.writeFileSync(path.join(newBase, file), JSON.stringify(arrayOfKotoba, null, 2))
  })
}

function checkWrongFormatNewStructure() {
  const files = fs.readdirSync(newBase)
  files.forEach((file) => {
    const jsonString = fs.readFileSync(path.join(newBase, file)).toString()
    const arr = JSON.parse(jsonString) as any[]
    arr.forEach((w) => {
      if (w.word === w.reading) {
        console.log(file, "-", w.word)
      }
    })
  })
}

checkWrongFormatNewStructure()
