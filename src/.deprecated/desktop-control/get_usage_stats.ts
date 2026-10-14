
export async function get_usage_stats(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/get_usage_stats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
