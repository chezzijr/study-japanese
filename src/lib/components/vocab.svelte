<script lang="ts">
    let { words, pronunciations, meanings, notes } = $props()
</script>

<div class="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 h-screen px-20">
    <table class="table table-pin-rows text-center">
        <thead class="text-2xl">
            <tr>
                <th>Từ</th>
                <th>Phiên âm Hiragana</th>
                <th>Nghĩa</th>
                <th>Ghi chú</th>
            </tr>
            <!-- <tr id="filter">
                <th><input type="text"></th>
            </tr> -->
        </thead>
        <tbody>
            {#each words as word, i}
                <tr class="hover:bg-base-300">
                    <td>{word}</td>
                    <td>{pronunciations[i]}</td>
                    <td>{meanings[i]}</td>
                    <td>{notes[i]}</td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>