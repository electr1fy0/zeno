export type Chat = {
  _id: string
  title?: string
  messages: Message[]
}

export type Message = {
  role: string
  content: string
}
