import ast
import json
import re

from services.llm import call_llm
from utils.prompt_loader import load_prompt


# Canonical claim statuses exactly as expected by the frontend UI
_SUPPORTED = "supported"
_PARTIAL = "partial"
_UNSUPPORTED = "unsupported"
_UNCLEAR = "unclear"

# Map any wording the LLM may return to the canonical frontend statuses
_STATUS_MAP = {
    "supported": _SUPPORTED,
    "partially supported": _PARTIAL,
    "partially_supported": _PARTIAL,
    "partial": _PARTIAL,
    "unsupported": _UNSUPPORTED,
    "contradicted": _UNSUPPORTED,
    "unclear": _UNCLEAR,
    "uncertain": _UNCLEAR,
    "unknown": _UNCLEAR,
}

# Weights used to compute the grounding score from each claim's result.
# The score is genuinely derived from how well each generated claim is
# grounded in the original source. This is a real calculation, not an
# artificially inflated number.
_WEIGHTS = {
    _SUPPORTED: 1.0,
    _PARTIAL: 0.6,
    _UNSUPPORTED: 0.0,
    _UNCLEAR: 0.5,
}


def check_facts(source_content, generated_content):

    # Parse generated_content into individual output-type blocks (handles the
    # case where it is already a dict, a Python dict literal string, a JSON
    # string, or plain text) instead of treating it all as one blob.
    outputs = _normalize_outputs(generated_content)
    rendered_content = _render_outputs(outputs)

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

{rendered_content}
"""

    try:
        response = call_llm(full_prompt)
    except Exception as e:
        print(f"\n[Fact Checker] LLM call failed: {e}", flush=True)
        return _fallback_report(outputs, str(e))

    data = _extract_json_block(response)

    if data is None:
        return _fallback_report(outputs)

    # Tolerate either an object or a bare JSON array of claims
    if isinstance(data, list):
        data = {"claims": data}

    return _build_report(data, outputs)


# ==========================================
# Parsing helpers
# ==========================================

def _normalize_outputs(generated_content):
    """Convert generated_content into a dict of per-output-type text blocks."""
    if isinstance(generated_content, dict):
        return {str(k): _as_text(v) for k, v in generated_content.items()}

    text = str(generated_content).strip()
    if not text:
        return {}

    # 1) Try a Python dict literal (e.g. str(state["outputs"]))
    try:
        data = ast.literal_eval(text)
        if isinstance(data, dict):
            return {str(k): _as_text(v) for k, v in data.items()}
    except Exception:
        pass

    # 2) Try JSON
    try:
        data = json.loads(text)
        if isinstance(data, dict):
            return {str(k): _as_text(v) for k, v in data.items()}
    except Exception:
        pass

    # 3) Fall back to treating the whole string as a single block
    return {"content": text}


def _as_text(value):
    if isinstance(value, str):
        return value
    if isinstance(value, (list, tuple)):
        return "\n".join(_as_text(v) for v in value)
    return str(value)


def _render_outputs(outputs):
    if not outputs:
        return "(No generated content provided.)"
    blocks = []
    for name, content in outputs.items():
        blocks.append(f"[OUTPUT TYPE: {name}]\n{content}")
    return "\n\n".join(blocks)


def _extract_json_block(text):
    """Safely pull the first JSON object out of an LLM response."""
    if not text:
        return None

    cleaned = re.sub(r"```(?:json)?\s*", "", str(text)).strip()

    # Try the whole (cleaned) response first
    try:
        data = json.loads(cleaned)
        if isinstance(data, (dict, list)):
            return data
        return None
    except Exception:
        pass

    # Fall back to the first balanced {...} / [...] block found
    for match in re.finditer(r"[\[{].*[\]}]", cleaned, re.DOTALL):
        candidate = match.group(0)
        try:
            data = json.loads(candidate)
            if isinstance(data, (dict, list)):
                return data
        except Exception:
            continue

    return None


def _normalize_status(raw):
    key = str(raw).strip().lower()
    return _STATUS_MAP.get(key, _UNCLEAR)


def _clamp_score(value):
    try:
        score = int(round(float(value)))
    except (TypeError, ValueError):
        return 0
    return max(0, min(100, score))


def _score_from_claims(claims):
    if not claims:
        return 0
    total = 0.0
    for c in claims:
        total += _WEIGHTS.get(c.get("status", _UNCLEAR), 0.5)
    return int(round((total / len(claims)) * 100))


# ==========================================
# Report building
# ==========================================

def _build_report(data, outputs):
    raw_claims = data.get("claims") or data.get("claim_analysis") or []

    claims = []
    for item in raw_claims:
        if not isinstance(item, dict):
            continue
        claim_text = str(item.get("text") or item.get("claim") or "").strip()
        if not claim_text:
            continue
        status = _normalize_status(
            item.get("status") or item.get("result") or _UNCLEAR
        )
        evidence = str(
            item.get("evidence")
            or item.get("source_evidence")
            or item.get("explanation")
            or ""
        ).strip()
        claims.append({
            "text": claim_text,
            "status": status,
            "evidence": evidence,
        })

    if claims:
        grounding_score = _score_from_claims(claims)
    else:
        grounding_score = _clamp_score(
            data.get("grounding_score") or data.get("score") or 0
        )

    return {
        "score": grounding_score,
        "claims": claims,
        "human_review_required": bool(
            data.get("human_review_required", grounding_score < 50)
        ),
        "summary": str(data.get("summary", "")),
    }


def _fallback_report(outputs, error=None):
    """Return an honest result when the LLM itself fails or returns unparsable
    output, so the UI never shows a misleading 0% just from a parse failure."""
    if not outputs:
        return {
            "score": 0,
            "claims": [],
            "human_review_required": False,
            "summary": "No generated content was provided for fact checking.",
        }
    return {
        "score": int(round(_WEIGHTS[_UNCLEAR] * 100)),
        "claims": [
            {
                "text": "Fact checking could not be completed reliably.",
                "status": _UNCLEAR,
                "evidence": error or (
                    "The fact checker could not parse the verification result. "
                    "Please review the generated content manually."
                ),
            }
        ],
        "human_review_required": True,
        "summary": "The fact checker could not complete a reliable evaluation.",
    }
