
export async function parse_prd(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/parse_prd", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
