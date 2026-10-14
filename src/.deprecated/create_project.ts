
export async function create_project(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/create_project", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
