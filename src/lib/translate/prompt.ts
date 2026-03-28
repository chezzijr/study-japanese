/**
 * Prompt templates for AI-powered Japanese-Vietnamese translation.
 *
 * V1 (legacy): single-step combined translation + tokenization.
 * V2 (current): two-step approach — translation first, then tokenization.
 */

import type { Direction } from './types';

// ── Helpers ────────────────────────────────────────────────────────────

function langLabel(dir: Direction, side: 'source' | 'target'): string {
	if (dir === 'jp-vn') return side === 'source' ? 'Japanese' : 'Vietnamese';
	return side === 'source' ? 'Vietnamese' : 'Japanese';
}

// ── V1 (legacy) prompts ────────────────────────────────────────────────

const JSON_SCHEMA_V1 = `{
  "sentences": [
    {
      "tokens": [
        {
          "id": <number>,
          "jp": "<surface form in Japanese text>",
          "vn": "<Vietnamese translation>",
          "base_form": "<dictionary form>",
          "reading": "<hiragana reading of base_form>",
          "type": "<word type in Vietnamese>",
          "grammar": {             // OPTIONAL - only for non-trivial forms
            "form": "<conjugation/grammar pattern>",
            "explanation": "<Vietnamese explanation>"
          },
          "context": "<role in sentence>",  // OPTIONAL - only if non-obvious
          "kanji": [               // OPTIONAL - only if jp contains kanji
            {
              "char": "<single kanji character>",
              "hv": "<Sino-Vietnamese / Han Viet reading>",
              "meaning": "<Vietnamese meaning>"
            }
          ]
        }
      ],
      "jp_order": [<token IDs in Japanese word order>],
      "vn_order": [<token IDs in natural Vietnamese SVO word order>],
      "vn_full": "<full Vietnamese translation of the sentence>"
    }
  ]
}`;

const EXAMPLE_INPUT_V1 = '私は毎日日本語を勉強しています。';

const EXAMPLE_OUTPUT_V1 = `{
  "sentences": [
    {
      "tokens": [
        {
          "id": 1,
          "jp": "私",
          "vn": "Tôi",
          "base_form": "私",
          "reading": "わたし",
          "type": "danh từ",
          "kanji": [
            { "char": "私", "hv": "TƯ", "meaning": "riêng tư, cá nhân" }
          ]
        },
        {
          "id": 2,
          "jp": "は",
          "vn": "",
          "base_form": "は",
          "reading": "は",
          "type": "trợ từ",
          "context": "trợ từ chủ đề, đánh dấu chủ đề của câu"
        },
        {
          "id": 3,
          "jp": "毎日",
          "vn": "mỗi ngày",
          "base_form": "毎日",
          "reading": "まいにち",
          "type": "phó từ",
          "kanji": [
            { "char": "毎", "hv": "MỖI", "meaning": "mỗi" },
            { "char": "日", "hv": "NHẬT", "meaning": "ngày" }
          ]
        },
        {
          "id": 4,
          "jp": "日本語",
          "vn": "tiếng Nhật",
          "base_form": "日本語",
          "reading": "にほんご",
          "type": "danh từ",
          "kanji": [
            { "char": "日", "hv": "NHẬT", "meaning": "ngày, mặt trời" },
            { "char": "本", "hv": "BẢN", "meaning": "gốc, sách" },
            { "char": "語", "hv": "NGỮ", "meaning": "ngôn ngữ" }
          ]
        },
        {
          "id": 5,
          "jp": "を",
          "vn": "",
          "base_form": "を",
          "reading": "を",
          "type": "trợ từ",
          "context": "trợ từ tân ngữ, đánh dấu đối tượng của hành động"
        },
        {
          "id": 6,
          "jp": "勉強しています",
          "vn": "đang học",
          "base_form": "勉強する",
          "reading": "べんきょうする",
          "type": "động từ III",
          "grammar": {
            "form": "ている",
            "explanation": "thể tiếp diễn - diễn tả hành động đang xảy ra hoặc trạng thái kéo dài"
          },
          "kanji": [
            { "char": "勉", "hv": "MIỄN", "meaning": "cố gắng" },
            { "char": "強", "hv": "CƯỜNG", "meaning": "mạnh" }
          ]
        }
      ],
      "jp_order": [1, 2, 3, 4, 5, 6],
      "vn_order": [1, 3, 6, 4],
      "vn_full": "Tôi mỗi ngày đang học tiếng Nhật."
    }
  ]
}`;

/**
 * @deprecated Use getTranslationSystemPrompt/getTokenizationSystemPrompt instead.
 * Get the system prompt for V1 single-step translation.
 */
export function getSystemPrompt(): string {
	return `You are a Japanese-Vietnamese translation engine for language learners.

## Task
Given Japanese text, produce a JSON object that:
1. Tokenizes each sentence into meaningful linguistic units
2. Provides Vietnamese translations for each token
3. Shows both Japanese word order and natural Vietnamese word order
4. Annotates grammar, context, and kanji where helpful

## Output JSON Schema
${JSON_SCHEMA_V1}

## Tokenization Rules (重要 - Very Important)

### Core principle
A token is a MEANINGFUL UNIT for a Vietnamese learner. Each token should be something a learner would look up in a dictionary or study as a grammar pattern. Map Japanese linguistic units to their Vietnamese equivalents.

### Compound words (複合語) — keep as ONE token
- Compound verbs: 引き出す, 取り出す, 見つける, 飛び出す, 思い出す, 切り替える, 受け取る
- Compound nouns: 引き出し, 花火, 気持ち, 出口, 入口, 目標
- Any word that has its own dictionary entry as a compound = ONE token

### Verb conjugations — keep the FULL conjugated form as ONE token
The entire conjugated form (stem + ending) is always ONE token. NEVER split a conjugated verb into parts:
- 五段 (godan): 書く→書いて→書いた→書かない→書ける→書かれる→書かせる (each is ONE token)
- 一段 (ichidan): 食べる→食べて→食べた→食べない→食べられる→食べさせる
- 不規則: する→した→して→しない→できる, くる→きた→きて→こない

### V-て + auxiliary verb — keep as ONE token
These grammar patterns function as a single unit. NEVER split V-て from its auxiliary:
- V-ている/V-てる (tiếp diễn), V-てみる (thử), V-てしまう/V-ちゃう (hoàn thành/hối tiếc)
- V-ていく (tiếp tục), V-てくる (bắt đầu/đến), V-ておく/V-とく (chuẩn bị trước)
- V-てあげる/V-てもらう/V-てくれる (cho/nhận hành động)
- V-てほしい (muốn ai làm gì)
- Example: 探してみる = ONE token, NOT 探し + て + みる

### Particles — keep SEPARATE
- Topic/case particles: は, が, を, に, で, と, も, へ, から, まで, より
- These are separate tokens with vn: "" (omitted from vn_order when no Vietnamese equivalent)
- Sentence-ending particles (よ, ね, か, etc.) should be separate tokens

### Sentence-ending expressions — ONE token
- V-んだ/V-のだ, V-だろう/V-でしょう, V-かもしれない, じゃないか

### い-adjective + です — ONE token (おいしいです, 高いです)
### な-adjective — keep adjective and だ/です SEPARATE (静かな, 静かだ)

### Punctuation and Latin/romaji text — 1-to-1 mapping
- Punctuation (。→., ！→!, ？→?, 「」→"" etc.): create a token with the JP punctuation as "jp" and equivalent VN punctuation as "vn". Include in both jp_order and vn_order at the same relative position. Set type to "trợ từ", base_form and reading same as jp.
- Latin/romaji words (proper nouns, brand names like "Zepp", "iPhone"): create a token with same text in both "jp" and "vn". Include in both jp_order and vn_order. Set type appropriately (usually "danh từ").

## Word Type Labels (Vietnamese)
Use these labels for the "type" field:
- "danh từ" (noun)
- "động từ I" (godan verb), "động từ II" (ichidan verb), "động từ III" (irregular verb)
- "tính từ い" (i-adjective), "tính từ な" (na-adjective)
- "phó từ" (adverb)
- "trợ từ" (particle)
- "liên từ" (conjunction)
- "thán từ" (interjection)
- "số từ" (numeral/counter)
- "đại từ" (pronoun)
- "tiếp đầu ngữ" / "tiếp vĩ ngữ" (prefix/suffix)

## Grammar Annotations
Only include the "grammar" field for NON-TRIVIAL forms:
- DO include: ている (tiếp diễn), ていた, たら (điều kiện), ば (điều kiện), なら, ても, られる (thể bị động), させる (thể sai khiến), できる/える (thể khả năng), てしまう, ようにする, ことがある, たい (mong muốn), てほしい, ないでください, etc.
- DO NOT include: basic Vる, Vます, Vません, Vました, Vませんでした (these are trivial conjugations)

## Context Annotations
Only include the "context" field when the token's role in the sentence is genuinely non-obvious:
- DO include: は as topic marker, unusual uses of particles, words with multiple meanings where context matters
- DO NOT include: obvious nouns, common verbs in their expected roles

## Kanji Annotations
- Include for EVERY token that contains kanji characters
- "hv" = Sino-Vietnamese (Han Viet) reading in UPPERCASE without diacritics (e.g., "NHAT", "BAN", "NGU")
- "meaning" = Brief Vietnamese meaning of the individual kanji

## CRITICAL: Token "vn" fields must compose into "vn_full"
- Each token's "vn" field should contain that token's PORTION of the natural Vietnamese sentence
- When you concatenate the "vn" values of tokens listed in "vn_order" (separated by spaces), the result MUST form the same sentence as "vn_full" (minus final punctuation)
- Do NOT use standalone dictionary translations — use the contextual form as it appears in the natural sentence

## Ghost Tokens (Untranslatable Tokens)
- Japanese tokens with no Vietnamese equivalent (は, が, を): set vn: "" and OMIT from vn_order
- If the natural Vietnamese sentence requires words that don't correspond to any Japanese token (e.g., added for fluency): create a token with jp: "" and a unique ID, include it in vn_order but OMIT from jp_order

## Vietnamese Word Order
- Vietnamese uses SVO (Subject-Verb-Object) word order
- "vn_order" must reflect NATURAL Vietnamese sentence order, NOT mirror Japanese SOV order
- Particles that have no Vietnamese equivalent (は, が, を) should be OMITTED from vn_order
- "vn_full" should be a natural, fluent Vietnamese sentence

## Important
- Token IDs must be unique within each sentence (start from 1)
- jp_order contains ALL token IDs that have a non-empty "jp" field; vn_order contains ALL token IDs that have a non-empty "vn" field
- Output ONLY valid JSON, no markdown fences, no extra text

## Example

Input: ${EXAMPLE_INPUT_V1}

Output:
${EXAMPLE_OUTPUT_V1}`;
}

/**
 * @deprecated Use getTranslationUserPrompt instead.
 * Get the user prompt for V1 single-step translation.
 */
export function getUserPrompt(text: string): string {
	return `Translate the following Japanese text. Return ONLY the JSON object, no other text.

${text}`;
}

// ── V2 Two-Step Prompts ────────────────────────────────────────────────

// ─── Step 1: Translation ───────────────────────────────────────────────

/**
 * System prompt for Step 1 — plain translation (no tokenization).
 *
 * @param direction - 'jp-vn' or 'vn-jp'
 * @param jlptLevel - Optional JLPT level hint (e.g. "N5") for vn-jp direction
 */
export function getTranslationSystemPrompt(direction: Direction, jlptLevel?: string): string {
	const source = langLabel(direction, 'source');
	const target = langLabel(direction, 'target');

	const jlptInstruction =
		direction === 'vn-jp' && jlptLevel
			? `\n7. Use Japanese vocabulary and grammar appropriate for JLPT ${jlptLevel}. Prefer simpler expressions when possible.`
			: '';

	return `You are a professional ${source}\u2192${target} translator.

RULES (MUST follow):
1. Output ONLY the translated text. No explanations, no notes, no formatting, no markdown.
2. NEVER include ${source} characters in your output.
3. Translate naturally and fluently \u2014 prioritize how a native ${target} speaker would say it.
4. Preserve sentence boundaries (one input sentence = one output sentence, separated by newlines).
5. Do NOT transliterate \u2014 translate meaning, not sound.
6. Proper nouns and brand names: keep original form if commonly used as-is in ${target}, otherwise translate.${jlptInstruction}`;
}

/**
 * User prompt for Step 1 — wraps the source text.
 */
export function getTranslationUserPrompt(text: string): string {
	return text;
}

// ─── Step 2: Tokenization ──────────────────────────────────────────────

const JSON_SCHEMA_V2 = `{
  "sentences": [
    {
      "source_text": "<original sentence>",
      "target_text": "<translated sentence from step 1>",
      "source_tokens": [
        {
          "id": <number>,
          "text": "<surface form>",
          "base_form": "<dictionary form>",
          "reading": "<hiragana reading>",
          "type": "<word type in Vietnamese>",
          "grammar": { "form": "<pattern>", "explanation": "<Vietnamese explanation>" },
          "context": "<role in sentence>",
          "kanji": [{ "char": "<kanji>", "hv": "<Sino-Vietnamese UPPERCASE>", "meaning": "<meaning>" }]
        }
      ],
      "target_tokens": [
        {
          "id": <number>,
          "text": "<surface form>",
          "base_form": "<dictionary form or same as text>",
          "reading": "<hiragana for JP, empty string for VN>",
          "type": "<word type in Vietnamese>"
        }
      ],
      "groups": [
        {
          "group_id": <number>,
          "source_ids": [<token IDs from source_tokens>],
          "target_ids": [<token IDs from target_tokens>]
        }
      ]
    }
  ]
}`;

const EXAMPLE_INPUT_V2_SOURCE = '私は毎日日本語を勉強しています。';
const EXAMPLE_INPUT_V2_TARGET = 'Tôi mỗi ngày đang học tiếng Nhật.';

const EXAMPLE_OUTPUT_V2 = `{
  "sentences": [
    {
      "source_text": "私は毎日日本語を勉強しています。",
      "target_text": "Tôi mỗi ngày đang học tiếng Nhật.",
      "source_tokens": [
        {
          "id": 1,
          "text": "私",
          "base_form": "私",
          "reading": "わたし",
          "type": "danh từ",
          "kanji": [
            { "char": "私", "hv": "TƯ", "meaning": "riêng tư, cá nhân" }
          ]
        },
        {
          "id": 2,
          "text": "は",
          "base_form": "は",
          "reading": "は",
          "type": "trợ từ",
          "context": "trợ từ chủ đề, đánh dấu chủ đề của câu"
        },
        {
          "id": 3,
          "text": "毎日",
          "base_form": "毎日",
          "reading": "まいにち",
          "type": "phó từ",
          "kanji": [
            { "char": "毎", "hv": "MỖI", "meaning": "mỗi" },
            { "char": "日", "hv": "NHẬT", "meaning": "ngày" }
          ]
        },
        {
          "id": 4,
          "text": "日本語",
          "base_form": "日本語",
          "reading": "にほんご",
          "type": "danh từ",
          "kanji": [
            { "char": "日", "hv": "NHẬT", "meaning": "ngày, mặt trời" },
            { "char": "本", "hv": "BẢN", "meaning": "gốc, sách" },
            { "char": "語", "hv": "NGỮ", "meaning": "ngôn ngữ" }
          ]
        },
        {
          "id": 5,
          "text": "を",
          "base_form": "を",
          "reading": "を",
          "type": "trợ từ",
          "context": "trợ từ tân ngữ, đánh dấu đối tượng của hành động"
        },
        {
          "id": 6,
          "text": "勉強しています",
          "base_form": "勉強する",
          "reading": "べんきょうする",
          "type": "động từ III",
          "grammar": {
            "form": "ている",
            "explanation": "thể tiếp diễn - diễn tả hành động đang xảy ra hoặc trạng thái kéo dài"
          },
          "kanji": [
            { "char": "勉", "hv": "MIỄN", "meaning": "cố gắng" },
            { "char": "強", "hv": "CƯỜNG", "meaning": "mạnh" }
          ]
        },
        {
          "id": 7,
          "text": "。",
          "base_form": "。",
          "reading": "。",
          "type": "trợ từ"
        }
      ],
      "target_tokens": [
        {
          "id": 1,
          "text": "Tôi",
          "base_form": "tôi",
          "reading": "",
          "type": "đại từ"
        },
        {
          "id": 2,
          "text": "mỗi ngày",
          "base_form": "mỗi ngày",
          "reading": "",
          "type": "phó từ"
        },
        {
          "id": 3,
          "text": "đang học",
          "base_form": "học",
          "reading": "",
          "type": "động từ"
        },
        {
          "id": 4,
          "text": "tiếng Nhật",
          "base_form": "tiếng Nhật",
          "reading": "",
          "type": "danh từ"
        },
        {
          "id": 5,
          "text": ".",
          "base_form": ".",
          "reading": "",
          "type": "trợ từ"
        }
      ],
      "groups": [
        { "group_id": 1, "source_ids": [1], "target_ids": [1] },
        { "group_id": 2, "source_ids": [2], "target_ids": [] },
        { "group_id": 3, "source_ids": [3], "target_ids": [2] },
        { "group_id": 4, "source_ids": [4], "target_ids": [4] },
        { "group_id": 5, "source_ids": [5], "target_ids": [] },
        { "group_id": 6, "source_ids": [6], "target_ids": [3] },
        { "group_id": 7, "source_ids": [7], "target_ids": [5] }
      ]
    }
  ]
}`;

/**
 * System prompt for Step 2 — tokenization and mapping.
 *
 * @param direction - 'jp-vn' or 'vn-jp'
 */
export function getTokenizationSystemPrompt(direction: Direction): string {
	const source = langLabel(direction, 'source');
	const target = langLabel(direction, 'target');

	return `You are a linguistic analysis engine for ${source}\u2192${target} translation.

## Task
You are given two texts:
- **Text A** (source): the original ${source} text
- **Text B** (target): the ${target} translation produced in a previous step

Your job is to produce a JSON object that:
1. Tokenizes both texts into meaningful linguistic units
2. Maps source tokens to target tokens via numbered groups
3. Annotates grammar, context, and kanji where helpful

**CRITICAL RULES — DO NOT VIOLATE:**
- Do NOT modify, correct, or improve either text. Use them EXACTLY as given.
- Concatenating all source_tokens' "text" fields (with NO separator for Japanese, SPACE separator for Vietnamese) MUST reproduce source_text exactly.
- Concatenating all target_tokens' "text" fields (with NO separator for Japanese, SPACE separator for Vietnamese) MUST reproduce target_text exactly.
- Every token must appear in EXACTLY one mapping group. No token may be left unmapped.
- Use empty arrays (source_ids: [] or target_ids: []) for tokens with no counterpart on the other side.
- In this translation, the source language is ${source} and the target language is ${target}. Annotations (grammar, kanji, reading) apply to Japanese tokens regardless of which side they are on.

## Output JSON Schema
${JSON_SCHEMA_V2}

Notes on the schema:
- "grammar", "context", and "kanji" are OPTIONAL fields on source_tokens. Include only when relevant (see annotation rules below).
- target_tokens are simpler: only "id", "text", "base_form", "reading", "type" are required.
- For Japanese tokens: "reading" = hiragana reading. For Vietnamese tokens: "reading" = "" (empty string).
- Token IDs are unique WITHIN their own array (source_tokens and target_tokens have independent ID sequences, both starting from 1).

## Japanese Tokenization Rules (重要 - Very Important)

### Core principle
A token is a MEANINGFUL UNIT for a Vietnamese learner. Each token should be something a learner would look up in a dictionary or study as a grammar pattern.

### Compound words (複合語) — keep as ONE token
- Compound verbs: 引き出す, 取り出す, 見つける, 飛び出す, 思い出す, 切り替える, 受け取る
- Compound nouns: 引き出し, 花火, 気持ち, 出口, 入口, 目標
- Any word that has its own dictionary entry as a compound = ONE token

### Verb conjugations — keep the FULL conjugated form as ONE token
The entire conjugated form (stem + ending) is always ONE token. NEVER split a conjugated verb into parts:
- 五段 (godan): 書く→書いて→書いた→書かない→書ける→書かれる→書かせる (each is ONE token)
- 一段 (ichidan): 食べる→食べて→食べた→食べない→食べられる→食べさせる
- 不規則: する→した→して→しない→できる, くる→きた→きて→こない

### V-て + auxiliary verb — keep as ONE token
These grammar patterns function as a single unit. NEVER split V-て from its auxiliary:
- V-ている/V-てる (tiếp diễn), V-てみる (thử), V-てしまう/V-ちゃう (hoàn thành/hối tiếc)
- V-ていく (tiếp tục), V-てくる (bắt đầu/đến), V-ておく/V-とく (chuẩn bị trước)
- V-てあげる/V-てもらう/V-てくれる (cho/nhận hành động)
- V-てほしい (muốn ai làm gì)
- Example: 探してみる = ONE token, NOT 探し + て + みる

### Particles — keep SEPARATE
- Topic/case particles: は, が, を, に, で, と, も, へ, から, まで, より
- These are separate tokens, typically mapped to an empty target_ids group
- Sentence-ending particles (よ, ね, か, etc.) should be separate tokens

### Sentence-ending expressions — ONE token
- V-んだ/V-のだ, V-だろう/V-でしょう, V-かもしれない, じゃないか

### い-adjective + です — ONE token (おいしいです, 高いです)
### な-adjective — keep adjective and だ/です SEPARATE (静かな, 静かだ)

### Punctuation and Latin/romaji text
- Punctuation (。, ！, ？, 「」, etc.): each punctuation mark is a standalone token. Set type to "trợ từ", base_form and reading same as text.
- Latin/romaji words (proper nouns, brand names like "Zepp", "iPhone"): ONE token. Set type appropriately (usually "danh từ").

## Vietnamese Tokenization Rules

### Core principle
Tokenize Vietnamese into meaningful linguistic units a learner would study individually.

### Multi-syllable words forming one concept = ONE token
- Common compounds: "học sinh", "bệnh viện", "máy tính", "trường học", "thành phố"
- Sino-Vietnamese compounds: "đại học", "công ty", "xã hội", "kinh tế", "giáo dục"
- These are single semantic units — NEVER split them into individual syllables.

### Function words = SEPARATE tokens
- Grammatical markers: của, được, bị, đã, sẽ, đang, không, rất, cũng, vẫn, còn, mới, chỉ, đều
- Each function word is its own token.

### Proper nouns = ONE token
- Person names: "Nguyễn Văn A", place names: "Hà Nội", "Thành phố Hồ Chí Minh"

### Punctuation = standalone token
- Period, comma, question mark, exclamation mark, quotes — each is a separate token.

## Mapping Group Rules

Every token (source and target) must appear in EXACTLY one group. Groups define how meaning flows between languages.

### Mapping patterns:
- **1:1** — One source token maps to one target token. Example: 私 → Tôi
- **1:N** — One source token maps to multiple target tokens. Example: 勉強しています → đang + học (one JP token maps to two VN tokens)
- **N:1** — Multiple source tokens map to one target token. Example: Multiple VN words collapse into one JP word.
- **1:0** — Source token has no counterpart. Example: Japanese particle は has no Vietnamese equivalent → source_ids: [2], target_ids: []
- **0:1** — Target token has no counterpart. Example: Vietnamese adds a function word for fluency → source_ids: [], target_ids: [5]

### Rules:
- A token ID must not appear in more than one group.
- After assigning all groups, every source token ID and every target token ID must be accounted for.
- group_id values should be sequential starting from 1.

## Word Type Labels (Vietnamese)
Use these labels for the "type" field:
- "danh từ" (noun)
- "động từ I" (godan verb), "động từ II" (ichidan verb), "động từ III" (irregular verb)
- "động từ" (verb — use when the token is Vietnamese and verb group is not applicable)
- "tính từ い" (i-adjective), "tính từ な" (na-adjective)
- "tính từ" (adjective — use for Vietnamese adjectives)
- "phó từ" (adverb)
- "trợ từ" (particle / grammatical marker)
- "liên từ" (conjunction)
- "thán từ" (interjection)
- "số từ" (numeral/counter)
- "đại từ" (pronoun)
- "tiếp đầu ngữ" / "tiếp vĩ ngữ" (prefix/suffix)

## Grammar Annotations (source_tokens only, Japanese tokens)
Only include the "grammar" field for NON-TRIVIAL forms:
- DO include: ている (tiếp diễn), ていた, たら (điều kiện), ば (điều kiện), なら, ても, られる (thể bị động), させる (thể sai khiến), できる/える (thể khả năng), てしまう, ようにする, ことがある, たい (mong muốn), てほしい, ないでください, etc.
- DO NOT include: basic Vる, Vます, Vません, Vました, Vませんでした (these are trivial conjugations)

## Context Annotations (source_tokens only)
Only include the "context" field when the token's role in the sentence is genuinely non-obvious:
- DO include: は as topic marker, unusual uses of particles, words with multiple meanings where context matters
- DO NOT include: obvious nouns, common verbs in their expected roles

## Kanji Annotations (Japanese tokens only)
- Include for EVERY Japanese token that contains kanji characters
- "hv" = Sino-Vietnamese (Han Viet) reading in UPPERCASE (e.g., "NHẬT", "BẢN", "NGỮ")
- "meaning" = Brief Vietnamese meaning of the individual kanji

## Concatenation Rule
- **Japanese** tokens concatenate with NO separator: token1.text + token2.text + ... must equal the Japanese text exactly.
- **Vietnamese** tokens concatenate with SPACE separator: token1.text + " " + token2.text + ... must equal the Vietnamese text exactly.
- The result MUST match source_text / target_text character-for-character. If it does not, you have tokenized incorrectly.

## Anti-Hallucination Rules
- Do NOT invent tokens that are not in the source or target text.
- Do NOT merge or rearrange characters from the original texts.
- Do NOT add explanatory text, translations, or notes outside the JSON.
- Do NOT wrap the JSON in markdown code fences.
- If a word is ambiguous, pick the meaning that fits the sentence context, not the most common dictionary meaning.

## Output
Output ONLY valid JSON matching the schema above. No markdown fences, no commentary, no extra text.

## Example

Source (Japanese): ${EXAMPLE_INPUT_V2_SOURCE}
Target (Vietnamese): ${EXAMPLE_INPUT_V2_TARGET}

Output:
${EXAMPLE_OUTPUT_V2}`;
}

/**
 * User prompt for Step 2 — provides source text and its translation.
 *
 * @param sourceText - The original source-language text
 * @param translation - The target-language translation from Step 1
 */
export function getTokenizationUserPrompt(sourceText: string, translation: string): string {
	return `Tokenize and map the following source text and its translation. Return ONLY the JSON object, no other text.

Source:
${sourceText}

Translation:
${translation}`;
}
