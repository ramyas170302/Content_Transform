import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def call_llm(prompt):

    response = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        max_tokens=500,
        reasoning_effort="low"
    )
    print("\n========== RAW GROQ RESPONSE ==========")
    print(response)
    print("=======================================\n")

    return response.choices[0].message.content