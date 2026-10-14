
export async function sendBroadcast(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/send-broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
