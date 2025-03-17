export type WordDefinition = {
    phonetic: string,
    vietnamsese: string,
    note: string,
}

export type Vocab = {
    [key: string]: WordDefinition
}