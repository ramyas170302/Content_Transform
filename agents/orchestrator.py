from agents.analyzer import analyze_content
from agents.planner import plan_outputs
from agents.summary import generate_summary
from agents.linkedin import generate_linkedin
from agents.twitter import generate_twitter
from agents.advisory import generate_advisory
from agents.presentation import generate_presentation
from agents.infographic import generate_infographic
from agents.fact_checker import check_facts


def run_workflow(source_content, selected_outputs):

    # 1. Analyze the source
    analyzed_content = analyze_content(source_content)

    # 2. Create the plan
    plan = plan_outputs(analyzed_content, selected_outputs)

    results = {}

    # 3. Generate selected outputs
    if "summary" in selected_outputs:
        results["summary"] = generate_summary(analyzed_content)

    if "linkedin" in selected_outputs:
        results["linkedin"] = generate_linkedin(analyzed_content)

    if "twitter" in selected_outputs:
        results["twitter"] = generate_twitter(analyzed_content)

    if "advisory" in selected_outputs:
        results["advisory"] = generate_advisory(analyzed_content)

    if "presentation" in selected_outputs:
        results["presentation"] = generate_presentation(analyzed_content)

    if "infographic" in selected_outputs:
        results["infographic"] = generate_infographic(analyzed_content)

    # 4. Combine generated outputs
    generated_content = str(results)

    # 5. Fact check everything
    fact_check = check_facts(
        source_content,
        generated_content
    )

    return {
        "analysis": analyzed_content,
        "plan": plan,
        "outputs": results,
        "fact_check": fact_check
    }