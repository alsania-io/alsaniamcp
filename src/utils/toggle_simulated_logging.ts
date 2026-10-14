
export async function toggleSimulatedLogging(input: any) {
  const res = await fetch("http://localhost:3000/mcp_everything/toggle-simulated-logging", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
