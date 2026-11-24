import { parse } from "../middleware/errors.js";
import { ContactMessage } from "../models/ContactMessage.js";
import { schemas } from "../utils/validation.js";

export async function sendContact(req, res) {
  const { name, email, message } = parse(schemas.contact, req.body);
  await ContactMessage.create({ name, email, message, ip: req.ip });
  res.status(201).json({ message: "Thanks, we've got your message and will reply soon." });
}
