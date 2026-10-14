
export async function validate_node_operation(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/validate_node_operation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
