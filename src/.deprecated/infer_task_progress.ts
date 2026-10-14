
export async function infer_task_progress(input: any) {
  const res = await fetch("http://localhost:3000/agentic-tools/infer_task_progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
