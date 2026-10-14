
export async function move_file(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/move_file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
