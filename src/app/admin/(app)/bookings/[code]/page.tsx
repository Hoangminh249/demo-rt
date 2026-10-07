import { BookingView } from '@/components/admin/views/booking'

export const metadata = { title: 'Chi tiết booking' }

export default async function AdminBookingPage({ params }: PageProps<'/admin/bookings/[code]'>) {
  return <BookingView code={(await params).code} />
}
