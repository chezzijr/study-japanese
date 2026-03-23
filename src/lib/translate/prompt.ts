/**
 * Prompt templates for AI-powered Japanese-Vietnamese translation
 */

const JSON_SCHEMA = `{
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

const EXAMPLE_INPUT = '私は毎日日本語を勉強しています。';

const EXAMPLE_OUTPUT = `{
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
 * Get the system prompt for translation
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
${JSON_SCHEMA}

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

Input: ${EXAMPLE_INPUT}

Output:
${EXAMPLE_OUTPUT}`;
}

/**
 * Get the user prompt for a specific text
 */
export function getUserPrompt(text: string): string {
	return `Translate the following Japanese text. Return ONLY the JSON object, no other text.

${text}`;
}
