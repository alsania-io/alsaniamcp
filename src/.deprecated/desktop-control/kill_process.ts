
export async function kill_process(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/kill_process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
