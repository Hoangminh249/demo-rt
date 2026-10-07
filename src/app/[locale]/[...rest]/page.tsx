import { notFound } from 'next/navigation'

// Mọi đường dẫn lạ trong /, /en rơi vào đây để hiện trang 404 đúng ngôn ngữ.
export default function CatchAll() { notFound() }
