
export async function search_memories(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/search_memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
