
export async function slack_reply_to_thread(input: any) {
  const res = await fetch("http://localhost:3000/slack/slack_reply_to_thread", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
