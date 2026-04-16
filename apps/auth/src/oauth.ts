
import jwt from "jsonwebtoken"
const SECRET = "dev-secret"

export function issueToken(userId: string, app: string) {
  return jwt.sign(
    { sub: userId, app, scopes: [`${app}:access`] },
    SECRET,
    { expiresIn: "15m" }
  )
}
