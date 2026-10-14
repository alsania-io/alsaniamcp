
export async function set_config_value(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/set_config_value", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
