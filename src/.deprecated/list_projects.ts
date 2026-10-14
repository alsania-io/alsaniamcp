
export async function list_projects(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/list_projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
