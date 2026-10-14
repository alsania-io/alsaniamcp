
export async function get_property_dependencies(input: any) {
  const res = await fetch("http://localhost:3000/n8n-mcp/get_property_dependencies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
