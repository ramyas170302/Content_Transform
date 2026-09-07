from agents.graph import app


print("======================================")
print("   AI CONTENT TRANSFORMATION PLATFORM")
print("======================================")


user_request = input(
    "\nWhat do you want me to create? "
)


print("\nPaste your source content.")
print("When finished, press ENTER and then CTRL+Z, ENTER.")
print()


lines = []

while True:

    try:
        line = input()
        lines.append(line)

    except EOFError:
        break


source_content = "\n".join(lines)


result = app.invoke({

    "source_content": source_content,

    "user_request": user_request,

    "analyzed_content": "",
    "plan": "",

    "selected_outputs": [],

    "current_index": 0,

    "outputs": {},

    "fact_check": ""
})


print("\n\n======================================")
print("              FINAL RESULT")
print("======================================")


print("\n📋 PLAN:")
print(result["plan"])


print("\n📝 GENERATED CONTENT:")

for output_type, content in result["outputs"].items():

    print("\n--------------------------------------")
    print(output_type.upper())
    print("--------------------------------------")

    print(content)


print("\n🔍 FACT CHECK:")
print(result["fact_check"])