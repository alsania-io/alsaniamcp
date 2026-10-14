
export async function register-agent(input: any) {
  const res = await fetch("http://localhost:3000/agentic-framework/register-agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
