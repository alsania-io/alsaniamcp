
export async function get_node_essentials(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/get_node_essentials", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
