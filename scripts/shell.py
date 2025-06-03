import os
import json
import argparse
import random as rd
from os import path
from dataclasses import dataclass


def parse_args():
    parser = argparse.ArgumentParser(
        description="Generate a shell script for practicing Japanese vocabulary."
    )
    parser.add_argument(
        "--num-questions",
        type=int,
        default=5,
        help="Number of questions to include in the script (default: 5)",
    )
    parser.add_argument(
        "--num-choices",
        type=int,
        default=4,
        help="Number of choices for each question (default: 4)",
    )
    return parser.parse_args()


args = parse_args()
num_questions = args.num_questions
num_choices = args.num_choices

script_dir = path.abspath(path.dirname(__file__))
proj_dir = path.dirname(script_dir)
kotoba_dir = path.join(proj_dir, "src", "lib", "n5")
kanji_dir = path.join(proj_dir, "src", "lib", "kanji")


@dataclass
class Kotoba:
    word: str
    pronunciation: str | None
    vietnamese: str
    note: str | None

    def __eq__(self, other):
        if not isinstance(other, Kotoba):
            return False
        return self.word == other.word or self.vietnamese == other.vietnamese


kotoba: list[Kotoba] = []
for filename in os.listdir(kotoba_dir):
    with open(path.join(kotoba_dir, filename), "r", encoding="utf-8") as f:
        dictionary = json.load(f)
        for word, data in dictionary.items():
            note = data.get("note", None)
            kotoba.append(
                Kotoba(
                    word=word,
                    pronunciation=data.get("pronunciation", None),
                    vietnamese=data["vietnamese"],
                    note=note,
                )
            )

try:
    for question in range(num_questions):
        print(f"Question {question + 1}:")
        choices = rd.sample(kotoba, num_choices)
        rd.shuffle(choices)
        correct_answer = rd.randint(0, num_choices - 1)
        flag = rd.randint(0, 1)
        if flag == 0:
            get_question = lambda x: x.word
            get_answer = lambda x: x.vietnamese
            get_hint = lambda x: x.pronunciation if x.pronunciation else x.note
            get_question_placeholder = lambda x: "{} trong tiếng Việt là gì?"
        else:
            get_question = lambda x: x.vietnamese
            get_answer = lambda x: x.word
            get_hint = lambda x: x.note if x.note else "Không có gợi ý."
            get_question_placeholder = lambda x: "{} trong tiếng Nhật là gì?"

        print(
            get_question_placeholder(choices[correct_answer]).format(
                get_question(choices[correct_answer])
            )
        )
        for i, choice in enumerate(choices):
            print(f"{i + 1}. {get_answer(choice)}")

        while user_answer := input(
            "Đáp án của bạn là (1-{}, 0 để hiện gợi ý nếu có, hoặc Ctrl-C để hủy): ".format(num_choices)
        ):
            if user_answer == "0":
                print("Gợi ý:", get_hint(choices[correct_answer]))
                continue
            try:
                user_answer = int(user_answer) - 1
                if 0 <= user_answer < num_choices:
                    if user_answer == correct_answer:
                        print("Chính xác!")
                    else:
                        print(
                            "Sai rồi! Đáp án đúng là:", get_answer(choices[correct_answer])
                        )
                    break
                else:
                    print(
                        f"Vui lòng nhập một số từ 1 đến {num_choices} hoặc 0 để hiện gợi ý."
                    )
            except ValueError:
                print("Vui lòng nhập một số hợp lệ.")
except KeyboardInterrupt:
    print("\nHủy bỏ.")
    exit(0)
