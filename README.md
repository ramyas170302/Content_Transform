# 🚀 Gen AI Platform for Automated Content Transformation

## 📌 Overview

**Gen AI Platform for Automated Content Transformation** is an AI-powered platform that converts one source of content into multiple useful formats automatically.

Instead of creating each format manually, the platform uses **Generative AI and multiple specialized agents** to analyze the content, plan the required outputs, generate them, and verify the generated information.

## 🎯 Problem Statement

**SIH26154 – Gen AI Platform for Automated Content Transformation**

Organizations often need the same information in different formats such as summaries, social media posts, presentations, and infographics. Creating these manually takes time and effort.

## 💡 Our Solution

Our platform provides an automated content transformation pipeline:

**Source Content → Analyzer → Planner → Output Agents → Fact Checker**

The user provides content and selects what they need. The system then automatically generates the required formats.

### ✨ Supported Outputs

* 📝 Summary
* 💼 LinkedIn Post
* 🐦 Twitter/X Post
* 📢 Advisory
* 📊 Presentation Content
* 🖼️ Infographic Content

## 🤖 AI Agents

The system uses multiple specialized AI agents:

| Agent        | Responsibility                                       |
| ------------ | ---------------------------------------------------- |
| Analyzer     | Understands and extracts important information       |
| Planner      | Decides which outputs should be generated            |
| Summary      | Creates a concise summary                            |
| LinkedIn     | Creates a professional LinkedIn post                 |
| Twitter      | Creates Twitter/X content                            |
| Advisory     | Generates advisory-style content                     |
| Presentation | Creates slide-by-slide content                       |
| Infographic  | Creates infographic-ready content                    |
| Fact Checker | Checks generated content against the original source |

## 🏗️ Architecture

```text
                    ┌─────────────────┐
                    │  Source Content │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ Analyzer Agent  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  Planner Agent  │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │  Output Router  │
                    └────────┬────────┘
                             ↓
        ┌────────────┬───────┼────────┬────────────┐
        ↓            ↓       ↓        ↓            ↓
     Summary     LinkedIn  Twitter  Advisory   Presentation
                                                     ↓
                                              Infographic
                                                     ↓
                                           ┌──────────────┐
                                           │ Fact Checker │
                                           └──────────────┘
```

## 🛠️ Technologies Used

* **Python**
* **Flask**
* **LangGraph**
* **Groq LLM**
* **Generative AI**
* **HTML**
* **CSS**
* **JavaScript**
* **Git & GitHub**

## 📁 Project Structure

```text
Content_Transform/
│
├── agents/
│   ├── analyzer.py
│   ├── planner.py
│   ├── summary.py
│   ├── linkedin.py
│   ├── twitter.py
│   ├── advisory.py
│   ├── presentation.py
│   ├── infographic.py
│   ├── fact_checker.py
│   └── graph.py
│
├── prompt/
│   ├── analyzer_prompt.txt
│   ├── planner_prompt.txt
│   ├── summary_prompt.txt
│   ├── linkedin_prompt.txt
│   ├── twitter_prompt.txt
│   ├── advisory_prompt.txt
│   ├── presentation_prompt.txt
│   ├── infographic_prompt.txt
│   └── fact_checker_prompt.txt
│
├── services/
│   └── llm.py
│
├── utils/
│   └── prompt_loader.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── app.py
├── requirements.txt
└── README.md
```

## ⚙️ How to Run

### 1. Clone the repository

```bash
git clone https://github.com/ramyas170302/Content_Transform.git
cd Content_Transform
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it on Windows:

```powershell
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Add your API key

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_api_key_here
```

**Never upload `.env` to GitHub.**

### 5. Start the backend

```bash
python app.py
```

The API will run at:

```text
http://127.0.0.1:5000
```

### 6. Start the frontend

Open another terminal:

```bash
cd frontend
python -m http.server 5500
```

Then open:

```text
http://127.0.0.1:5500
```

## 🔄 Workflow

1. User enters source content.
2. Analyzer Agent understands the content.
3. Planner Agent determines the required outputs.
4. Router sends the request to the selected output agents.
5. Output agents generate the requested content.
6. Fact Checker compares the generated content with the original source.
7. Final results are displayed to the user.

## 🔐 Security

* API keys are stored in environment variables.
* `.env` is excluded using `.gitignore`.
* Generated content is checked against the original source using a Fact Checker Agent.

## 🎯 SIH Details

| Field        | Details                                                  |
| ------------ | -------------------------------------------------------- |
| Problem ID   | **SIH26154**                                             |
| Problem      | **Gen AI Platform for Automated Content Transformation** |
| Organization | **National Technical Research Organisation (NTRO)**      |
| Category     | **Software**                                             |
| Theme        | **Blockchain & Cybersecurity**                           |
| Team         | **InnoSpark**                                            |

## 🚀 Future Enhancements

* PDF/document upload
* More output formats
* Multilingual content generation
* Improved fact verification
* Content history and versioning
* User authentication
* Cloud deployment
* Advanced analytics

## 👩‍💻 Team

**Team InnoSpark**

Built for **Smart India Hackathon 2026**.
