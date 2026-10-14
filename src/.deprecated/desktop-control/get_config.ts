
export async function get_config(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/get_config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
