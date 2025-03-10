<script lang="ts">
    let { words, phonetics, meanings, notes } = $props()

    function focusRow(e: MouseEvent) {
        const tr = e.target as HTMLTableRowElement;
        tr.classList.add('bg-base-200');
    }

    function unfocusRow(e: MouseEvent) {
        const tr = e.target as HTMLTableRowElement;
        tr.classList.remove('bg-base-200');
    }
</script>

<div class="overflow-x-auto">
    <table class="table table-md table-pin-rows table-pin-cols text-center">
        <thead>
            <tr>
                <th>Từ</th>
                <th>Phiên âm Hiragana</th>
                <th>Nghĩa</th>
                <th>Ghi chú</th>
            </tr>
        </thead>
        <tbody>
            {#each words as word, i}
                <tr onmouseenter={focusRow} onmouseleave={unfocusRow}>
                    <td>{word}</td>
                    <td>{phonetics[i]}</td>
                    <td>{meanings[i]}</td>
                    <td>{notes[i]}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>