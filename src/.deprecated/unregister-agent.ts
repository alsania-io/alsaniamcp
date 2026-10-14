
export async function unregister-agent(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/unregister-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
