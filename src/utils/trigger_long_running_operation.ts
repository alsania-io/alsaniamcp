
export async function triggerLongRunningOperation(input: any) {
  const res = await fetch("http://localhost:3000/mcp_everything/trigger-long-running-operation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
