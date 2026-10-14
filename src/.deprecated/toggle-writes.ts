
export async function toggle-writes(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/toggle-writes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
