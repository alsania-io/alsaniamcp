
export async function checkForMessages(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/check-for-messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
