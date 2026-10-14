
export async function list_sessions(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/list_sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
