
export async function search_node_properties(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/search_node_properties", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
