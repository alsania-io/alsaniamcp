
export async function getResourceReference(input: any) {
  const res = await fetch("http://localhost:3000/mcp_everything/get-resource-reference", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
