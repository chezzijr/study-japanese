<script lang="ts">
	import type { Dictionary } from '$lib/types/vocab';
    import Furigana from './furigana.svelte';
    import { fit } from 'furigana';

    let {
        dictionary,
    }: {dictionary: Dictionary} = $props();

    const dict = Object.entries(dictionary).map(([key, value]) => ({ word: key, ...value }));
    console.log('Dictionary loaded:', dict);

    let index = $state(Math.floor(Math.random() * dict.length));

    function generateOptions() {
        const options = [dict[index]];
        while (options.length < 4) {
            const randomIndex = Math.floor(Math.random() * dict.length);
            const randomAnswer = dict[randomIndex];
            // special case: same vietnamese meaning
            if (
                options.every(opt => opt.vietnamese !== randomAnswer.vietnamese) &&
                options.every(opt => opt.word !== randomAnswer.word)
            ) {
                options.push(randomAnswer);
            }
        }
        return options.sort(() => Math.random() - 0.5);
    }

    function prepareQuestion() {
        const quesType = Math.random() > 0.5 ? 'word' : 'meaning';
        const placeholder = quesType === 'word' ? 'Nghĩa tiếng Việt của từ: ' : 'Từ tiếng Nhật của: ';
        const obj = {
            placeholder: placeholder,
            word: dict[index],
            options: generateOptions(),
            type: quesType
        };
        console.log('Question prepared:', obj);
        return obj;
    }

    let q = $derived(prepareQuestion());

    function resetQuestion() {
        index = Math.floor(Math.random() * dict.length);
    }

    function isErrorFitting(text: string, reading: string) {
        try {
            fit(text, reading);
            return false;
        } catch (e) {
            return true;
        }
    }

    function handleClick(e: MouseEvent, opt: number) {
        const node = e.target as HTMLButtonElement;
        if (
            q.type === 'word' && q.options[opt].vietnamese === q.word.vietnamese ||
            q.type === 'meaning' && q.options[opt].word === q.word.word
        ) {
            node.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.1)' },
                { transform: 'scale(1)' }
            ], {
                duration: 500,
                easing: 'ease'
            });
            setTimeout(() => {
                resetQuestion();
            }, 500);
        } else {
            node.animate([
                { transform: 'translateX(10px)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(0)' },
                { transform: 'translateX(10px)' },
                { transform: 'translateX(-10px)' },
                { transform: 'translateX(0)' },
            ], {
                duration: 500,
                easing: 'ease',
            });
        }
    }

    const btns = ['info', 'success', 'warning', 'error'].map((btn) => {
        return "btn btn-outline btn-" + btn;
    });

</script>

<main class="w-screen h-screen flex flex-col justify-center items-center gap-10">
	<h1 class="h1">
        {q.placeholder}
        {#if q.type === 'word' && q.word.pronunciation && !isErrorFitting(q.word.word, q.word.pronunciation)}
            <Furigana text={q.word.word} reading={q.word.pronunciation} />
        {:else if q.type === 'word'}
            {q.word.word}
        {:else}
            {q.word.vietnamese}
        {/if}
    </h1>
	<section class="w-[60%] grid grid-cols-2 gap-4">
        {#each q.options as option, index}
            <button class={btns[index]} onclick={(e) => handleClick(e, index)}>
                {#if q.type === 'word'}
                    {option.vietnamese}
                {:else if q.type === 'meaning' && option.pronunciation && !isErrorFitting(option.word, option.pronunciation)}
                    <Furigana text={option.word} reading={option.pronunciation} />
                {:else}
                    {option.word}
                {/if}
            </button>
        {/each}
	</section>
</main>


