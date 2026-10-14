
export async function slack_list_channels(input: any) {
  const res = await fetch("http://localhost:3000/slack/slack_list_channels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
