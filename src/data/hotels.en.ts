// Bản tiếng Anh của nội dung mẫu — giống CMS lưu một bản dịch cho mỗi ngôn ngữ. Chỉ src/lib/repo import file này.
// Mảng facts / amenities / restaurants / experiences dịch theo đúng thứ tự trong hotels.ts (icon, ảnh, link giữ nguyên).

export interface HotelEN {
  area: string; address: string; tagline: string; description: string; highlights: string[]
  facts: [label: string, value: string][]; amenities: string[]
  restaurants: [meta: string, desc: string][]; experiences: [name: string, desc: string][]
  distances: [string, string][]; policies: [string, string][]; faq: [string, string][]
}

const POLICIES: [string, string][] = [
  ['Check-in', 'From 14:00'],
  ['Check-out', 'Before 12:00'],
  ['Cancellation', 'Rates marked "Free cancellation": free up to 3 days before check-in. Non-refundable rates: no refund.'],
  ['Children', 'Under 6 stay free using existing beds. Ages 6–11: breakfast surcharge VND 150,000/night.'],
  ['Pets', 'Pets are not allowed.'],
]

export const HOTELS_EN: Record<string, HotelEN> = {
  H01: {
    area: 'South island · Hon Thom', address: 'Hon Thom Island, An Thoi, Phu Quoc',
    tagline: 'An island resort on Hon Thom, the sea right outside your door',
    description: 'PITO Hòn Thơm sits on a white-sand beach in the south of the island, 5 minutes from the Hon Thom cable car. 52 sea-view or garden-view rooms, an infinity pool, a Kids Club and a seafood restaurant at the water’s edge.',
    highlights: ['Private beach and infinity pool', '5 minutes to the Hon Thom cable car', 'Kids Club for families with little ones', 'Seafood restaurant at the water’s edge'],
    facts: [['Address', 'Hon Thom Island, An Thoi, Phu Quoc'], ['Check-in / out', '14:00 / 12:00'], ['Getting around', '5 minutes to the Hon Thom cable car'], ['Size', '52 rooms, 4 room types']],
    amenities: ['Infinity pool', 'Private beach', 'Kids Club', 'Spa', 'Gym', 'Seafood restaurant', 'Sunset bar', 'Free Wi-Fi', 'Airport transfer'],
    restaurants: [
      ['Phu Quoc seafood · 11:00–22:00', 'Pick fresh seafood from the tank, cooked fishing-village style.'],
      ['Asian & Western breakfast buffet · 06:30–10:30', 'Breakfast buffet with local fish-cake noodle soup and bún quậy.'],
      ['Bar & light bites · 16:00–23:00', 'A sunset bar right on the beach.'],
    ],
    experiences: [['Hon Thom cable car', '5 minutes from the hotel'], ['Snorkeling by RIVUS speedboat', 'Out to the An Thoi archipelago'], ['Night squid fishing', 'Rooty Trip tour, lobby pickup']],
    distances: [['Hon Thom cable car station', '5 min'], ['Phu Quoc Airport', '50 min'], ['Sunset Town', '20 min'], ['Phu Quoc Night Market', '60 min']],
    policies: POLICIES,
    faq: [
      ['Does the hotel offer airport pickup?', 'Yes. Book direct for 2+ nights and get a free one-way Rooty Trip pickup; otherwise it is charged per car.'],
      ['How long from the airport to the hotel?', 'About 35 minutes by car to the An Thoi cable car station, then 15 minutes by cable car or 20 minutes by speedboat.'],
      ['Are there rooms for a family of 4?', 'Yes: Family Ocean View (2 adults + 2 children) and Family Suite (up to 4 adults + 2 children).'],
      ['How can I pay?', 'International card, ATM/QR or bank transfer when booking online; some rates let you pay at the hotel.'],
    ],
  },
  H02: {
    area: 'Town centre · Duong Dong', address: '68 Tran Hung Dao, Duong Dong, Phu Quoc',
    tagline: 'In the heart of Duong Dong, a short walk to the night market',
    description: 'Calista is right on Tran Hung Dao: 10 minutes to the airport and a walk to Phu Quoc Night Market. Rooftop pool, indoor Kids Club and a Family Suite for families of 4. Ideal for guests who want town life and a tour every day.',
    highlights: ['10 minutes to Phu Quoc Airport', '7-minute walk to the night market', 'Rooftop pool and bar', 'Rooty Trip tour pickup at the lobby'],
    facts: [['Address', '68 Tran Hung Dao, Duong Dong, Phu Quoc'], ['Check-in / out', '14:00 / 12:00'], ['Getting around', '10 minutes to Phu Quoc Airport'], ['Size', '28 rooms, 3 room types']],
    amenities: ['Rooftop pool', 'Kids Club', 'Restaurant', 'Rooftop bar', 'Gym', 'Free Wi-Fi', 'Parking', 'Airport transfer', 'Near the night market'],
    restaurants: [['Asian & Western · 06:30–22:00', 'Breakfast buffet, à la carte lunch and dinner.'], ['Rooftop bar · 17:00–24:00', 'Panoramic views over Duong Dong from the rooftop.']],
    experiences: [['Phu Quoc Night Market', '7-minute walk from the hotel'], ['4-island speedboat tour', 'Rooty Trip lobby pickup at 7:30'], ['RIVUS sunset cruise', 'Departs from Duong Dong port']],
    distances: [['Phu Quoc Airport', '10 min'], ['Phu Quoc Night Market', '7 min walk'], ['Bai Truong beach', '10 min'], ['Hon Thom cable car station', '40 min']],
    policies: POLICIES,
    faq: [
      ['Does the hotel offer airport pickup?', 'Yes. Book direct for 2+ nights and get a free one-way Rooty Trip pickup.'],
      ['How far is the beach?', 'About 10 minutes by car to Bai Truong; the hotel runs a scheduled shuttle.'],
      ['Are there rooms for a family of 4?', 'Yes: the Family Suite has bunk beds for 2 kids, right next to the Kids Club.'],
      ['How can I pay?', 'International card, ATM/QR or bank transfer when booking online; some rates let you pay at the hotel.'],
    ],
  },
}

const BASE = ['Air conditioning', 'Minibar', 'Safe', 'Wi-Fi']
export const ROOMS_EN: Record<string, { beds: string; view: string; amenities: string[]; description: string }> = {
  'RT-PITO-DOV': { beds: '1 King or 2 single beds', view: 'Sea view', amenities: ['Balcony', 'Bathtub', ...BASE], description: 'A balcony facing the Hon Thom sea, with a bathtub by the glass doors.' },
  'RT-PITO-FOV': { beds: '1 King + 1 sofa bed', view: 'Sea view', amenities: ['Balcony', 'Kids corner', ...BASE], description: '45m² with a sofa bed for 2 kids, close to the Kids Club.' },
  'RT-PITO-FS': { beds: '2 bedrooms: 1 King + 2 singles', view: 'Sea view', amenities: ['Private living room', '2 bathrooms', ...BASE], description: 'Two bedrooms and a private living room for multi-generation families.' },
  'RT-PITO-SG': { beds: '1 Queen bed', view: 'Garden view', amenities: BASE, description: 'Quiet, overlooking the tropical garden.' },
  'RT-CAL-SUP': { beds: '1 Queen bed', view: 'City view', amenities: BASE, description: 'Neat and compact, overlooking central Duong Dong.' },
  'RT-CAL-DPV': { beds: '1 King bed', view: 'Pool view', amenities: ['Balcony', ...BASE], description: 'A balcony overlooking the pool.' },
  'RT-CAL-FS': { beds: '1 King + 2 bunk beds', view: 'Pool view', amenities: ['Kids bunk beds', 'Bathtub', ...BASE], description: 'Bunk beds for the kids, right next to the Kids Club.' },
}

export const PLAN_NAMES_EN = { breakfast: 'Breakfast included', roomOnly: 'Room only' }
