
export async function force_terminate(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/force_terminate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
