
export async function delete_subtask(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/delete_subtask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
