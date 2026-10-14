
export async function start_search(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/start_search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
