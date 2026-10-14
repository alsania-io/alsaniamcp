
export async function write_pdf(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/write_pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
