<script lang="ts">
    import { fly } from 'svelte/transition';

    let { 
        quesList, 
        ansList, 
        hintList, 
        keyName, 
        valueName,
        swappable
    } = $props()

    const firstList = quesList;
    const secondList = ansList;
    const len = firstList.length;
    
    let swp = $state(false);
    let quesType: 'first' | 'second' = $state('first');
	let index = $state(randomIndex());
    let showHint = $state(false);
	let quesWord = $derived(quesType == 'first' ? firstList[index] : secondList[index]);
	let options = $derived(populateOptions(index));

	function randomIndex() {
		return Math.floor(Math.random() * len);
	}

	function populateOptions(index: number) {
		const options = [];
        const answers = quesType == 'first' ? secondList : firstList;
        // if a list of answer, quesTyoe is first only
        if (answers[index].constructor === Array) {
            // push a random element from the list
            options.push(answers[index][Math.floor(Math.random() * answers[index].length)]);
            while (options.length < 4) {
                let i = randomIndex();
                let rndItem = answers[i][Math.floor(Math.random() * answers[i].length)];
                if (i != index && !options.includes(rndItem)) {
                    options.push(rndItem);
                }
            }
        } else {
            options.push(answers[index]);
            while (options.length < 4) {
                let i = randomIndex();
                if (i != index && !options.includes(answers[i])) {
                    options.push(quesType == 'first' ? secondList[i] : firstList[i]);
                }
            }
        }

        // shuffle the options
        options.sort(() => Math.random() - 0.5);
		return options;
	}

    function nextQuestion() {
        if (swp)
            quesType = Math.random() > 0.5 ? 'first' : 'second';

        showHint = false;
        index = randomIndex();
    }

    function questionTitle() {
        return quesWord;
    }

    function handleClick(e: MouseEvent, opt: number) {
        const node = e.target as HTMLButtonElement;
        if ((quesType === 'first' ? secondList[index] : firstList[index]).constructor === Array) {
            // if the answer is a list, we need to check if the clicked option is in the list
            if ((quesType === 'first' ? secondList[index] : firstList[index]).includes(options[opt])) {
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
            return;
        }
        if (options[opt] == (quesType === 'first' ? secondList[index] : firstList[index])) {
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
    {#if swappable}
        <label class="swap swap-flip text-9xl">
            <!-- this hidden checkbox controls the state -->
            <input type="checkbox" bind:checked={swp}/>
            
            <div class="tooltip swap-off" data-tip="Hỏi 1 chiều">
                😇
            </div>
            <div class="tooltip swap-on" data-tip="Hỏi 2 chiều">
                😈
            </div>
        </label>
    {/if}
	<h1 class="h1">{questionTitle()}</h1>
    {#if hintList && hintList[index]}
        <button id="hint" class="btn btn-outline btn-primary" onclick={() => showHint = !showHint}>Hint</button>
        {#if showHint}
            <p in:fly={{ y: 10, duration: 500 }}>{hintList[index]}</p>
        {/if}
    {/if}
	<section class="w-[60%] grid grid-cols-2 gap-4">
		<button class="btn btn-outline btn-info" onclick={(e) => handleClick(e, 0)}>{options[0]}</button>
		<button class="btn btn-outline btn-success" onclick={(e) => handleClick(e, 1)}>{options[1]}</button>
		<button class="btn btn-outline btn-warning" onclick={(e) => handleClick(e, 2)}>{options[2]}</button>
		<button class="btn btn-outline btn-error" onclick={(e) => handleClick(e, 3)}>{options[3]}</button>
	</section>
</main>

