
export async function agent-ai-assist(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/agent-ai-assist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
