
export async function search_templates(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/search_templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
