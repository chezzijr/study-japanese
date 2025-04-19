<script lang="ts">
    const unitImportObject = import.meta.glob('$lib/n5/*.json');
    const unitFiles = Object.keys(unitImportObject);
    const units = unitFiles.length;
    let vocabUnit = 1;
    let practiceUnit = 1;
</script>

<!-- Table of content -->
<main class="font-mono p-10  flex flex-col">
    <h1 class="text-3xl">Quá trình học tiếng Nhật</h1>
    
    <h3 class="text-xl">Luyện tập Hiragana và Katakana</h3>
    <a class="link" href="/practice/hiragana">Hiragana</a>
    <a class="link" href="/practice/katakana">Katakana</a>
    <br>
    <h3 class="text-xl">Từ vựng N5</h3>
    <a class="link" href="/vocab/n5/all">Tất cả từ vựng</a>
    <a class="link" href="/practice/n5/all">Luyện tập tất cả từ vựng</a>
    <br>
    
    <div>
        Từ vựng theo Unit
        <select class="select select-primary max-w-xs" bind:value={vocabUnit}>
            <option disabled selected>Chọn Unit</option>
            {#each Array.from({ length: units }, (_, i) => i + 1) as unit}
                <option value={unit}>{unit}</option>
            {/each}
        </select>
        <a class="link" href={`/vocab/n5/u${vocabUnit}`}>Di chuyển</a>
    </div>
    
    <div>
        Luyện tập từ vựng theo Unit
        <select class="select select-secondary max-w-xs" bind:value={practiceUnit}>
            <option disabled selected>Chọn Unit</option>
            {#each Array.from({ length: units }, (_, i) => i + 1) as unit}
                <option value={unit}>{unit}</option>
            {/each}
        </select>
        <a class="link" href={`/practice/n5/u${practiceUnit}`}>Di chuyển</a>
    </div>
</main>