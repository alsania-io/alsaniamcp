
export async function list_tasks(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/list_tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
