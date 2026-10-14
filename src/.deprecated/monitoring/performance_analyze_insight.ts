
export async function performance_analyze_insight(input: any) {
  const res = await fetch("http://localhost:3000/mimic/performance_analyze_insight", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
