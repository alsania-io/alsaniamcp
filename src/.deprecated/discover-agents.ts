
export async function discover-agents(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/discover-agents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
