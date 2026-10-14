
export async function performance_stop_trace(input: any) {
  const res = await fetch("http://localhost:3000/mimic/performance_stop_trace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
