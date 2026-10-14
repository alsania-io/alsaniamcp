
export async function get_more_search_results(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/get_more_search_results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
