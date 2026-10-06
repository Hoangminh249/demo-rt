import { LeadPage } from '@/components/site/lead-page'

export const metadata = { title: 'Hội nghị & Sự kiện' }

export default function MicePage() {
  return (
    <LeadPage kind="mice" title="Hội nghị & Sự kiện" image="/images/mice.jpg"
      intro="Hội nghị, team building, gala dinner cho 20–300 khách: phòng nghỉ, hội trường, xe đưa đón và tour Rooty Trip trong một đầu mối."
      points={['Một đầu mối báo giá trọn gói: phòng + hội trường + xe + tour', 'Gala dinner trên bãi biển hoặc du thuyền RIVUS', 'Hợp đồng, công nợ và hoá đơn công ty', 'Đội điều hành Rooty Trip hỗ trợ tại chỗ']}
      venues={[{ name: 'PITO Hòn Thơm · Ballroom bãi biển', desc: '200 khách, sân khấu ngoài trời' }, { name: 'Calista · Phòng hội nghị 68', desc: '120 khách, trung tâm Dương Đông' }, { name: 'Sao Biển Bãi Dài · Bãi cỏ', desc: 'Team building 300 khách' }, { name: 'Du thuyền RIVUS', desc: 'Gala hoàng hôn 60 khách' }]} />
  )
}
