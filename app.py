# ==========================================
# Flask Backend for AI Content Transformation
# ==========================================

from flask import Flask, request, jsonify
from flask_cors import CORS
from agents.graph import app as graph_app


# ==========================================
# 1. Flask Setup
# ==========================================

app = Flask(__name__)


# ==========================================
# 2. CORS
# ==========================================

CORS(app)


# ==========================================
# 3. Health Check
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "AI Content Transformation API is running",
        "status": "success"
    })


# ==========================================
# 4. Transform Endpoint
# ==========================================

@app.route("/transform", methods=["POST"])
def transform():

    # ------------------------------------------
    # Parse JSON body
    # ------------------------------------------

    data = request.get_json()

    if not data:
        return jsonify({
            "success": False,
            "error": "No JSON data provided"
        }), 400

    source_content = data.get("source_content", "").strip()
    user_request = data.get("user_request", "").strip()

    # ------------------------------------------
    # Validate inputs
    # ------------------------------------------

    if not source_content:
        return jsonify({
            "success": False,
            "error": "Source content is required"
        }), 400

    if not user_request:
        return jsonify({
            "success": False,
            "error": "User request is required"
        }), 400

    # ------------------------------------------
    # Run LangGraph pipeline
    # ------------------------------------------

    try:

        result = graph_app.invoke({
            "source_content": source_content,
            "user_request": user_request,
            "analyzed_content": "",
            "plan": "",
            "selected_outputs": [],
            "current_index": 0,
            "outputs": {},
            "fact_check": ""
        })

        # ------------------------------------------
        # Return frontend-friendly response
        # ------------------------------------------

        return jsonify({
            "success": True,
            "plan": result.get("plan", ""),
            "outputs": result.get("outputs", {}),
            "fact_check": result.get("fact_check", "")
        })

    except Exception as e:

        print(f"\n❌ Error: {e}", flush=True)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# ==========================================
# 5. Server Startup
# ==========================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
