import os


def load_prompt(filename):

    base_dir = os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )

    path = os.path.join(
        base_dir,
        "prompt",
        filename
    )

    with open(
        path,
        "r",
        encoding="utf-8"
    ) as file:

        return file.read()