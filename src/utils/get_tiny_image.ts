
export async function getTinyImage(input: any) {
  const res = await fetch("http://localhost:3000/mcp_everything/get-tiny-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
