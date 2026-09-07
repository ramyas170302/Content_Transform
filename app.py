# ==========================================
# Flask Backend for AI Content Transformation
# ==========================================

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from agents.graph import app as graph_app


# ==========================================
# 1. Flask Setup
# ==========================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")


# ==========================================
# 2. CORS
# ==========================================

CORS(app)


# ==========================================
# 3. Serve Frontend (root / static assets)
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


# ==========================================
# 4. Health Check
# ==========================================

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "message": "AI Content Transformation API is running",
        "status": "success"
    })


# ==========================================
# 5. Transform Endpoint
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
# 6. Server Startup
# ==========================================

if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
