
export async function get_recent_tool_calls(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/get_recent_tool_calls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
