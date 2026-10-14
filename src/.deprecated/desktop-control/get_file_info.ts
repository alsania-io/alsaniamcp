
export async function get_file_info(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/get_file_info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
