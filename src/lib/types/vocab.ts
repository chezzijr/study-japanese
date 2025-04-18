export type WordDefinition = {
    pronunciation: string,
    vietnamese: string,
    note: string,
}

export type Dictionary = {
    [key: string]: WordDefinition
}