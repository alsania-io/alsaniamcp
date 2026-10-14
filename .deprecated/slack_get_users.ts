
export async function slack_get_users(input: any) {
  const res = await fetch("http://localhost:3000/slack/slack_get_users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
