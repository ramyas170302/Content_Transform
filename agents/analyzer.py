from services.llm import call_llm
from utils.prompt_loader import load_prompt


def analyze_content(source_content):

    # Load analyzer prompt
    prompt = load_prompt("analyzer_prompt.txt")

    # Add the user's source content
    full_prompt = f"""
{prompt}

==================================================
SOURCE CONTENT
==================================================

{source_content}
"""

    # Send everything to the LLM
    response = call_llm(full_prompt)

    return response