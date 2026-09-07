from services.llm import call_llm

print("Testing LLM...")

result = call_llm(
    "Explain artificial intelligence in exactly 20 words."
)

print("\nRAW RESULT:")
print(repr(result))

print("\nTEST COMPLETED!")