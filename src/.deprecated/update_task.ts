
export async function update_task(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/update_task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
