export type Chat = {
  _id: string
  messages: Message[]
}

export type Message = {
  role: string
  content: string
}
