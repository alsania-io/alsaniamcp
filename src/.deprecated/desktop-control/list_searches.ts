
export async function list_searches(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/list_searches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
