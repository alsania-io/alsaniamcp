
export async function get_task(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/get_task", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
