from services.llm import call_llm
from utils.prompt_loader import load_prompt


def plan_outputs(analyzed_content, selected_outputs):

    prompt = load_prompt("planner_prompt.txt")

    full_prompt = f"""
{prompt}

==================================================
ANALYZED CONTENT
==================================================

{analyzed_content}

==================================================
SELECTED OUTPUTS
==================================================

{selected_outputs}
"""

    response = call_llm(full_prompt)

    return response