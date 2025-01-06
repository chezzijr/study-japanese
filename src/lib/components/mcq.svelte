<script lang="ts">
	// import hiragana from '$lib/writing/hiragana.json';

    let { map, keyName, valueName } = $props()

    const firstList = Object.keys(map);
    const secondList = Object.values(map);
    const len = firstList.length;

    let quesType: 'first' | 'second' = $state('first');
	let index = $state(randomIndex());
	let quesWord = $derived(quesType == 'first' ? firstList[index] : secondList[index]);
	let options = $derived(populateOptions(index));

	function randomIndex() {
		return Math.floor(Math.random() * len);
	}

	function populateOptions(index: number) {
		const options = [];
		options.push(quesType == 'first' ? secondList[index] : firstList[index]);
		while (options.length < 4) {
			let i = randomIndex();
			if (i != index) {
				options.push(quesType == 'first' ? secondList[i] : firstList[i]);
			}
		}
		return options;
	}

    function nextQuestion() {
        quesType = Math.random() > 0.5 ? 'first' : 'second';
        console.log(quesType);
        index = randomIndex();
    }

    function questionTitle() {
        return `What is the ${quesType == 'first' ? valueName : keyName} for this ${quesType == 'first' ? keyName : valueName}: ${quesWord}?`;
    }

    function handleClick(e: MouseEvent, opt: number) {
        const node = e.target as HTMLButtonElement;
        if (options[opt] == (quesType == 'first' ? secondList[index] : firstList[index])) {
            // correct animation including pop sound
            node.animate([
                { transform: 'scale(1)' },
                { transform: 'scale(1.1)' },
                { transform: 'scale(1)' }
            ], {
                duration: 500,
                easing: 'ease'
            });
            setTimeout(() => {
                nextQuestion();
            }, 500);
        } else {
            // incorrect animation including error sound
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

</script>

<main class="w-screen h-screen flex flex-col justify-center items-center gap-10">
	<h1 class="h1">{questionTitle()}</h1>
	<section class="w-[60%] grid grid-cols-2 gap-4">
		<button class="btn btn-outline btn-info" onclick={(e) => handleClick(e, 0)}>{options[0]}</button>
		<button class="btn btn-outline btn-success" onclick={(e) => handleClick(e, 1)}>{options[1]}</button>
		<button class="btn btn-outline btn-warning" onclick={(e) => handleClick(e, 2)}>{options[2]}</button>
		<button class="btn btn-outline btn-error" onclick={(e) => handleClick(e, 3)}>{options[3]}</button>
	</section>
</main>

