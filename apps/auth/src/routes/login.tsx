
import {
  Form,
  TextField,
  Label,
  Input,
  Button
} from "@heroui/react"

export default function Login() {
  async function handleSubmit(e: any) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    await fetch("/api/auth/sign-in", {
      method: "POST",
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    })

    const redirect = new URLSearchParams(location.search).get("redirect") || "/"
    location.href = redirect
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Form onSubmit={handleSubmit} className="w-96">
        <TextField name="email">
          <Label>Email</Label>
          <Input />
        </TextField>

        <TextField name="password">
          <Label>Password</Label>
          <Input type="password" />
        </TextField>

        <Button type="submit">Login</Button>
      </Form>
    </div>
  )
}
