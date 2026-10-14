
export async function give_feedback_to_desktop_commander(input: any) {
  const res = await fetch("http://localhost:3000/desktop-commander/give_feedback_to_desktop_commander", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  })
  return res.json()
}
