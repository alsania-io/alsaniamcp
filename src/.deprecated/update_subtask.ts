
export async function update_subtask(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/update_subtask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
