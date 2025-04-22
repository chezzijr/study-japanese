<script lang="ts">
    import F from "$lib/components/furigana.svelte";
</script>

<main class="font-mono py-16 px-24 flex flex-col">
    <section class="text-lg">
        <h1 class="text-3xl">Nhóm động từ</h1>
        <h3 class="text-xl">Động từ nhóm 1: Godan</h3>
        <p>Là động từ có dạng nguyên thể kết thúc bằng âm "う" và dạng lịch sự kết thúc bằng âm "います".</p>
        <p>Ví dụ nguyên thể: <F text="書く" reading="かく" />, <F text="飲む" reading="のむ" />, <F text="買う" reading="かう" /></p>
        <p>Ví dụ lịch sự: <F text="書きます" reading="かきます" />, <F text="飲みます" reading="のみます" />, <F text="買います" reading="かいます" /></p>
        <p>Các từ như <F text="食べる" reading="たべる" /> có thể lịch sự là <F text="食べます" reading="たべます" /> nên không phải là nhóm I</p>
    </section>
    <br>
    <section class="text-lg">
        <h3 class="text-xl">Động từ nhóm 2: Ichidan</h3>
        <p class="text-lg">Là động từ có dạng nguyên thể kết thúc bằng âm "る" và dạng lịch sự kết thúc bằng âm "えます".</p>
        <p>Ví dụ nguyên thể: <F text="食べる" reading="たべる" />, <F text="見る" reading="みる" /></p>
        <p>Ví dụ lịch sự: <F text="食べます" reading="たべます" />, <F text="見ます" reading="みます" /></p>
        <p>Ngoại lệ bao gồm:</p>
        <ul class="list-disc pl-8">
            <!-- okimasu, mimasu, abimasu, ochimasu, imasu, dekimasu, tarimasu, shinjimasu, karimasu, kimasu, orimasu -->
            <li><F text="起きる" reading="おきる" /> / <F text="起きます" reading="おきます" />: Thức dậy</li>
            <li><F text="見る" reading="みる" /> / <F text="見ます" reading="みます" />: Nhìn</li>
            <li><F text="浴びる" reading="あびる" /> / <F text="浴びます" reading="あびます" />: Tắm</li>
            <li><F text="落ちる" reading="おちる" /> / <F text="落ちます" reading="おちます" />: Rơi</li>
            <li><F text="いる" reading="いる" /> / <F text="います" reading="います" />: Có</li>
            <li><F text="できる" reading="できる" /> / <F text="できます" reading="できます" />: Có thể</li>
            <li><F text="足りる" reading="たりる" /> / <F text="足ります" reading="たりま" />: Đủ</li>
            <li><F text="信じる" reading="しんじる" /> / <F text="信じます" reading="しんじます" />: Tin tưởng</li>
            <li><F text="借りる" reading="かりる" /> / <F text="借ります" reading="かります" />: Mượn</li>
            <li><F text="着る" reading="きる" /> / <F text="着ます" reading="きます" />: Mặc</li>
            <li><F text="降りる" reading="おりる" /> / <F text="降ります" reading="おります" />: Xuống</li>
        </ul>
        <p>Cách nhớ: buổi sáng <strong class="underline">thức dậy</strong> <strong class="underline">nhìn</strong>
        thấy khăn <strong class="underline">tắm</strong> rơi xuống đất và nhìn xung quanh xem <strong class="underline">có</strong> 
        ai <strong class="underline">có thể</strong> <strong class="underline">đủ</strong> <strong class="underline">tin tưởng</strong> để
        cho <strong class="underline">mượn</strong> đồ <strong class="underline">mặc</strong> để <strong class="underline">xuống</strong> dưới nhà
        </p>
    </section>
    <br>
    <section class="text-lg">
        <h3 class="text-xl">Động từ nhóm 3: Bất quy tắc</h3>
        <p class="text-lg">Là động từ có dạng nguyên thể kết thúc bằng âm "する" và dạng lịch sự kết thúc bằng âm "します".</p>
        <p class="text-lg">Hoặc dạng nguyên thể kết thúc bằng âm "くる" và dạng lịch sự kết thúc bằng âm "きます".</p>
        <p>Ví dụ nguyên thể: <F text="する" reading="する" />, <F text="くる" reading="くる" /></p>
        <p>Ví dụ lịch sự: <F text="します" reading="します" />, <F text="きます" reading="きます" /></p>
        <p>Được dùng nhiều trong các từ ghép như <F text="勉強する" reading="べんきょうする" /> (học), <F text="運動する" reading="うんどうする" /> (vận động), <F text="掃除する" reading="そうじする" /> (dọn dẹp)</p>
    </section>
</main>