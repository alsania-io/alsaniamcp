
export async function validate_workflow_connections(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/validate_workflow_connections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
