
export async function migrate_subtasks(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/migrate_subtasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
