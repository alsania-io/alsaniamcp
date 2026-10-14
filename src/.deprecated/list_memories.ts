
export async function list_memories(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/list_memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
