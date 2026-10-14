
export async function list_processes(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/list_processes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
