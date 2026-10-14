
export async function slack_add_reaction(input: any) {
  const res = await fetch("http://localhost:3000/slack/slack_add_reaction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
