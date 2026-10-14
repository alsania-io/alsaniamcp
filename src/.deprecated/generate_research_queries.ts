
export async function generate_research_queries(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/generate_research_queries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
