
export async function slack_post_message(input: any) {
  const res = await fetch("http://localhost:3000/slack/slack_post_message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
