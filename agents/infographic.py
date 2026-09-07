from services.llm import call_llm
from utils.prompt_loader import load_prompt


def generate_infographic(analyzed_content):

    prompt = load_prompt("infographic_prompt.txt")

    full_prompt = f"""
{prompt}

==================================================
ANALYZED CONTENT
==================================================

{analyzed_content}
"""

    response = call_llm(full_prompt)

    return response