
export async function status(input: any) {
  const res = await fetch("http://localhost:3000/mimic/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
