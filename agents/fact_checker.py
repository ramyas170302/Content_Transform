from services.llm import call_llm
from utils.prompt_loader import load_prompt


def check_facts(source_content, generated_content):

    prompt = load_prompt("fact_checker_prompt.txt")

    full_prompt = f"""
{prompt}

==================================================
ORIGINAL SOURCE
==================================================

{source_content}

==================================================
GENERATED CONTENT
==================================================

{generated_content}
"""

    response = call_llm(full_prompt)

    return response