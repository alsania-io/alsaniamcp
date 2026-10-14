
export async function read_process_output(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/read_process_output", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
