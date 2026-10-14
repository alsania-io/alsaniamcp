
export async function read_multiple_files(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/read_multiple_files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
