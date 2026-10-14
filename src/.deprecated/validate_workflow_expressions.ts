
export async function validate_workflow_expressions(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/validate_workflow_expressions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
