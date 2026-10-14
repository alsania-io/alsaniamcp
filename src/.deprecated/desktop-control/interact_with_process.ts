
export async function interact_with_process(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/interact_with_process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
