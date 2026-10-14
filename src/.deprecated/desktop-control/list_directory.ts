
export async function list_directory(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/list_directory", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
