import { LeadPage } from '@/components/site/lead-page'

export const metadata = { title: 'Wedding' }

export default function WeddingPage() {
  return (
    <LeadPage kind="wedding" title="Wedding bên biển Phú Quốc" image="/images/wedding.svg"
      intro="Lễ cưới, tiệc cưới, chụp ảnh cưới và tuần trăng mật — trên bãi biển, trong villa hay trên du thuyền RIVUS."
      points={['Gói lễ cưới bãi biển cho 30–150 khách', 'Phòng nghỉ cho khách mời với giá nhóm', 'Tuần trăng mật: ưu đãi Honeymoon −10%', 'Du thuyền RIVUS cho buổi chụp ảnh hoàng hôn']}
      venues={[{ name: 'PITO Hòn Thơm · Bãi cát trắng', desc: '150 khách, view Hòn Thơm' }, { name: 'Sao Biển Bãi Dài · Villa', desc: 'Tiệc thân mật 30 khách' }, { name: 'Rạng Đông Bay · Bãi Khem', desc: 'Lễ cưới hoàng hôn' }, { name: 'Du thuyền RIVUS', desc: 'Chụp ảnh & tiệc trên biển' }]} />
  )
}
