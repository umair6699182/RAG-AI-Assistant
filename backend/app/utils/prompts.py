def build_rag_prompt(context: str, question: str):
    return f"""
You are a helpful document assistant.

Use the context below to answer the user's question.

If the user asks for summary, main points, important points, or explanation,
summarize the most relevant ideas from the context.

Only say "I don't know based on the uploaded document" if the context is empty
or completely unrelated.

Context:
{context}

Question:
{question}

Answer:
"""