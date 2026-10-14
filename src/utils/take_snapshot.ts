
export async function take_snapshot(input: any) {
  const res = await fetch("http://localhost:3000/mimic/take_snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
