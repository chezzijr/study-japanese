<script lang="ts">
    let { words, phonetics, meanings, notes } = $props()
</script>

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
    <table class="table table-md table-pin-rows table-pin-cols text-center">
        <thead>
            <tr>
                <td>Từ</td>
                <td>Phiên âm Hiragana</td>
                <td>Nghĩa</td>
                <td>Ghi chú</td>
            </tr>
        </thead>
        <tbody>
            {#each words as word, i}
                <tr class="hover:bg-base-300">
                    <td>{word}</td>
                    <td>{phonetics[i]}</td>
                    <td>{meanings[i]}</td>
                    <td>{notes[i]}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>