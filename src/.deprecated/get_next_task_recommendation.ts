
export async function get_next_task_recommendation(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/get_next_task_recommendation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
