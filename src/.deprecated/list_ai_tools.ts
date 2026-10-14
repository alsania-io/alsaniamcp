
export async function list_ai_tools(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/list_ai_tools", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
