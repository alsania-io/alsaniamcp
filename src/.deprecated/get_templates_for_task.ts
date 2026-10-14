
export async function get_templates_for_task(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/get_templates_for_task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
