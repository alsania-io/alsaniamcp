
export async function search_nodes(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/search_nodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
