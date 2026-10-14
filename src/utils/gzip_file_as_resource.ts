
export async function gzipFileAsResource(input: any) {
  const res = await fetch("http://localhost:3000/mcp_everything/gzip-file-as-resource", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
