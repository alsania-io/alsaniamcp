
export async function tools_documentation(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/tools_documentation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
