from langgraph.graph import StateGraph, END
from typing import TypedDict

from agents.analyzer import analyze_content
from agents.planner import plan_outputs

from agents.summary import generate_summary
from agents.linkedin import generate_linkedin
from agents.twitter import generate_twitter
from agents.advisory import generate_advisory
from agents.presentation import generate_presentation
from agents.infographic import generate_infographic

from agents.fact_checker import check_facts


# ==========================================
# 1. STATE
# ==========================================

class State(TypedDict):
    source_content: str
    user_request: str

    analyzed_content: str
    plan: str

    selected_outputs: list
    current_index: int

    outputs: dict
    fact_check: str


# ==========================================
# 2. ANALYZER
# ==========================================

def analyzer_node(state):

    print("\n🔎 Analyzer Agent running...", flush=True)

    analyzed = analyze_content(
        state["source_content"]
    )

    print("✅ Analyzer completed!", flush=True)

    return {
        "analyzed_content": analyzed
    }


# ==========================================
# 3. PLANNER
# ==========================================

def planner_node(state):

    print("\n🧠 Planner Agent running...", flush=True)

    plan = plan_outputs(
        state["analyzed_content"],
        state["user_request"]
    )

    print("✅ Planner completed!", flush=True)

    selected = []

    plan_lower = plan.lower()

    if "summary" in plan_lower:
        selected.append("summary")

    if "linkedin" in plan_lower:
        selected.append("linkedin")

    if "twitter" in plan_lower:
        selected.append("twitter")

    if "advisory" in plan_lower:
        selected.append("advisory")

    if "presentation" in plan_lower:
        selected.append("presentation")

    if "infographic" in plan_lower:
        selected.append("infographic")

    return {
        "plan": plan,
        "selected_outputs": selected
    }


# ==========================================
# 4. ROUTER
# ==========================================

def router_node(state):

    print("\n🔀 ROUTER")

    print(
        "Selected outputs:",
        state["selected_outputs"]
    )

    return {
        "current_index": 0,
        "outputs": {}
    }


# ==========================================
# 5. OUTPUT AGENT RUNNER
# ==========================================

def output_node(state):

    selected_outputs = state["selected_outputs"]

    current_index = state["current_index"]

    # No more agents
    if current_index >= len(selected_outputs):
        return {}

    output_type = selected_outputs[current_index]

    print(f"\n🤖 Running {output_type} agent...")

    analyzed_content = state["analyzed_content"]

    # --------------------------------------
    # Select the required agent
    # --------------------------------------

    if output_type == "summary":

        result = generate_summary(
            analyzed_content
        )

    elif output_type == "linkedin":

        result = generate_linkedin(
            analyzed_content
        )

    elif output_type == "twitter":

        result = generate_twitter(
            analyzed_content
        )

    elif output_type == "advisory":

        result = generate_advisory(
            analyzed_content
        )

    elif output_type == "presentation":

        result = generate_presentation(
            analyzed_content
        )

    elif output_type == "infographic":

        result = generate_infographic(
            analyzed_content
        )

    else:

        result = f"Unknown output type: {output_type}"

    # --------------------------------------
    # Store result
    # --------------------------------------

    outputs = dict(
        state.get("outputs", {})
    )

    outputs[output_type] = result

    # Move to next agent
    next_index = current_index + 1

    return {
        "outputs": outputs,
        "current_index": next_index
    }


# ==========================================
# 6. DECIDE WHAT HAPPENS AFTER OUTPUT
# ==========================================

def route_after_output(state):

    if state["current_index"] < len(
        state["selected_outputs"]
    ):

        return "outputs"

    return "fact_checker"


# ==========================================
# 7. ROUTE FROM MAIN ROUTER
# ==========================================

def route_from_router(state):

    if len(state["selected_outputs"]) == 0:

        return "fact_checker"

    return "outputs"


# ==========================================
# 8. FACT CHECKER
# ==========================================

def fact_checker_node(state):

    print("\n🔍 Running Fact Checker...")

    result = check_facts(
        state["source_content"],
        str(state["outputs"])
    )

    return {
        "fact_check": result
    }


# ==========================================
# 9. CREATE GRAPH
# ==========================================

graph = StateGraph(State)


# ==========================================
# 10. ADD NODES
# ==========================================

graph.add_node(
    "analyzer",
    analyzer_node
)

graph.add_node(
    "planner",
    planner_node
)

graph.add_node(
    "router",
    router_node
)

graph.add_node(
    "outputs",
    output_node
)

graph.add_node(
    "fact_checker",
    fact_checker_node
)


# ==========================================
# 11. MAIN FLOW
# ==========================================

graph.set_entry_point("analyzer")

graph.add_edge(
    "analyzer",
    "planner"
)

graph.add_edge(
    "planner",
    "router"
)


# ==========================================
# 12. DYNAMIC ROUTING
# ==========================================

graph.add_conditional_edges(

    "router",

    route_from_router,

    {
        "outputs": "outputs",
        "fact_checker": "fact_checker"
    }
)


# ==========================================
# 13. OUTPUT LOOP
# ==========================================

graph.add_conditional_edges(

    "outputs",

    route_after_output,

    {
        "outputs": "outputs",
        "fact_checker": "fact_checker"
    }
)


# ==========================================
# 14. FACT CHECKER → END
# ==========================================

graph.add_edge(
    "fact_checker",
    END
)


# ==========================================
# 15. COMPILE
# ==========================================

app = graph.compile()