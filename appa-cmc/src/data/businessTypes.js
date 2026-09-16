import {
  Coffee,
  Users,
  Store,
  Heart,
  Music,
  Mic,
  Target,
  BedDouble,
  PartyPopper,
  Building2,
  ShoppingCart,
} from 'lucide-react'

export const businessTypes = {
  coffee: { label: 'Cà phê / F&B', icon: Coffee, bg: '#FFEADB', border: '#AC7F5E' },
  restaurant: { label: 'Nhà hàng / Hội nghị', icon: Users, bg: '#F6C7C8', border: '#B32E31' },
  store: { label: 'Cửa hàng', icon: Store, bg: '#C9DAFE', border: '#2563EB' },
  gym: { label: 'Gym & Spa', icon: Heart, bg: '#D8FFF3', border: '#059669' },
  karaokeRoom: { label: 'Karaoke Phòng', icon: Music, bg: '#EEDBFF', border: '#9333EA' },
  karaokeBox: { label: 'Karaoke Box', icon: Mic, bg: '#D6BDEB', border: '#7E22CE' },
  bar: { label: 'Bar / Nightlife', icon: Target, bg: '#F6D3DB', border: '#E11D48' },
  hotel: { label: 'Lưu trú / Khách sạn', icon: BedDouble, bg: '#FFF3DA', border: '#CA8A04' },
  entertainment: { label: 'Khu vui chơi', icon: PartyPopper, bg: '#FFE9DE', border: '#EA580C' },
  mall: { label: 'TTTM / Văn phòng', icon: Building2, bg: '#EBF3FF', border: '#475569' },
  supermarket: { label: 'Siêu thị', icon: ShoppingCart, bg: '#E2FFEC', border: '#16A34A' },
}
