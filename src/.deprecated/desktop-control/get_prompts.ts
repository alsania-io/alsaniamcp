
export async function get_prompts(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/get_prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
