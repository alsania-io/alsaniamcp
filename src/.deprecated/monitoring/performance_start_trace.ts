
export async function performance_start_trace(input: any) {
  const res = await fetch("http://localhost:3000/mimic/performance_start_trace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
