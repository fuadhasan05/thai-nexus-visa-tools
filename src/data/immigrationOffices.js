const immigrationOffices = [
  {
    id: 'immigration-division-1',
    name: 'Immigration Division 1',
    address: 'Government Complex Building B, 120 Chaeng Watthana Rd, Thung Song Hong, Lak Si, Bangkok 10210',
    city: 'Bangkok',
    province: 'Bangkok',
    latitude: 13.8837,
    longitude: 100.5654,
    phone: '+66 2 141 9951',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Visa extensions', '90-day reporting', 'TM30 reporting'],
    tips: [
      'Arrive early to avoid peak queues, especially on Mondays.',
      'Bring photocopies of your passport ID page, visa, and most recent entry stamp.'
    ]
  },
  {
    id: 'one-stop-service-center',
    name: 'One Stop Service Center (Thailand Cultural Centre)',
    address: 'MRT Thailand Cultural Centre, Exit 3, B1 Floor, Ratchadaphisek Rd, Din Daeng, Bangkok 10400',
    city: 'Bangkok',
    province: 'Bangkok',
    latitude: 13.7614,
    longitude: 100.5696,
    phone: '+66 2 209 1100',
    hours: 'Mon-Fri 09:00-18:00',
    services: ['Business visa services', 'Investment visa support', 'Work permit coordination'],
    tips: [
      'This office focuses on BOI-supported companies and fast-track services.',
      'Prepare supporting corporate documents in advance; originals are often required.'
    ]
  },
  {
    id: 'bureau-public-works-town-country',
    name: 'Bureau of Public Works and Town & Country Planning',
    address: 'Rama 9 Government Complex, 120 Chaeng Watthana Rd, Thung Song Hong, Lak Si, Bangkok 10210',
    city: 'Bangkok',
    province: 'Bangkok',
    latitude: 13.8842,
    longitude: 100.5658,
    phone: '+66 2 353 3076',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Land use certifications', 'Construction permits for foreign businesses'],
    tips: [
      'Foreign-language support is limited; consider bringing a Thai colleague or translator.'
    ]
  },
  {
    id: 'pinklao-immigration-office',
    name: 'Pinklao Immigration Office',
    address: 'SM Tower, 979/41 Phahonyothin Rd, Samsen Nai, Phaya Thai, Bangkok 10400',
    city: 'Bangkok',
    province: 'Bangkok',
    latitude: 13.7793,
    longitude: 100.5425,
    phone: '+66 2 433 8802',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Specialized visa processing', 'Residence certificate pickup'],
    tips: [
      'Check appointment availability online; walk-ins are limited at peak periods.'
    ]
  },
  {
    id: 'thai-working-permit-residence-office',
    name: 'Thai Working Permit & Residence Office',
    address: 'Government Complex Building A, 120 Chaeng Watthana Rd, Thung Song Hong, Lak Si, Bangkok 10210',
    city: 'Bangkok',
    province: 'Bangkok',
    latitude: 13.8823,
    longitude: 100.5655,
    phone: '+66 2 209 1100',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Work permit issuance', 'Residence permit services'],
    tips: [
      'Bring original company registration papers for work-permit filings.'
    ]
  },
  {
    id: 'dan-khun-thot-checkpoint',
    name: 'Immigration Checkpoint Dan Khun Thot',
    address: 'Dan Khun Thot District Office, Dan Khun Thot, Nakhon Ratchasima 30210',
    city: 'Dan Khun Thot',
    province: 'Nakhon Ratchasima',
    latitude: 15.2161,
    longitude: 101.2168,
    phone: '+66 44 892 120',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Border pass issuance', 'Visa extensions for local residents'],
    tips: []
  },
  {
    id: 'bangkok-bank-headquarters',
    name: 'Bangkok Bank Headquarters Immigration Desk',
    address: '333 Silom Rd, Silom, Bang Rak, Bangkok 10500',
    city: 'Bangkok',
    province: 'Bangkok',
    latitude: 13.7261,
    longitude: 100.5283,
    phone: '+66 2 231 4333',
    hours: 'Mon-Fri 09:00-15:30',
    services: ['Banking-related immigration confirmations'],
    tips: []
  },
  {
    id: 'chiang-mai-provincial-immigration',
    name: 'Chiang Mai Provincial Immigration Office',
    address: '71 Moo 3 Sanambin Rd, Suthep, Mueang Chiang Mai, Chiang Mai 50200',
    city: 'Chiang Mai',
    province: 'Chiang Mai',
    latitude: 18.7712,
    longitude: 98.9684,
    phone: '+66 53 201 755',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Visa extensions', 'Residence certificate', '90-day reporting'],
    tips: [
      'Expect longer queues around visa high seasons (Oct-Feb).'
    ]
  },
  {
    id: 'chiang-mai-airport-checkpoint',
    name: 'Chiang Mai Airport Immigration Checkpoint',
    address: 'Chiang Mai International Airport, Mahidol Rd, Suthep, Chiang Mai 50200',
    city: 'Chiang Mai',
    province: 'Chiang Mai',
    latitude: 18.7678,
    longitude: 98.962,
    phone: '+66 53 201 623',
    hours: 'Daily 24 hours',
    services: ['Airport arrivals & departures', 'Visa on arrival assistance'],
    tips: []
  },
  {
    id: 'lamphun-immigration',
    name: 'Lamphun Immigration Office',
    address: '246 Moo 3, Ban Klang, Mueang Lamphun, Lamphun 51000',
    city: 'Ban Klang',
    province: 'Lamphun',
    latitude: 18.5806,
    longitude: 99.0096,
    phone: '+66 53 525 642',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Visa extensions', 'Local stay reporting'],
    tips: []
  },
  {
    id: 'lampang-immigration',
    name: 'Lampang Immigration Office',
    address: 'Phrabat, Mueang Lampang District, Lampang 52000',
    city: 'Lampang',
    province: 'Lampang',
    latitude: 18.2884,
    longitude: 99.4969,
    phone: '+66 54 265 097',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Visa extensions', '90-day reporting'],
    tips: []
  },
  {
    id: 'mae-hong-son-immigration',
    name: 'Mae Hong Son Immigration Office',
    address: '1 Khunlumprapas Rd, Chong Kham, Mueang Mae Hong Son, Mae Hong Son 58000',
    city: 'Mae Hong Son',
    province: 'Mae Hong Son',
    latitude: 19.3012,
    longitude: 97.9695,
    phone: '+66 53 611 109',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Visa extensions', 'Border pass services'],
    tips: []
  },
  {
    id: 'mae-sai-permanent-checkpoint',
    name: 'Mae Sai Permanent Immigration Checkpoint',
    address: 'Mae Sai Immigration, Mae Sai, Chiang Rai 57130',
    city: 'Mae Sai',
    province: 'Chiang Rai',
    latitude: 20.4397,
    longitude: 99.8824,
    phone: '+66 53 732 028',
    hours: 'Daily 06:00-18:00',
    services: ['Permanent border checkpoint'],
    tips: []
  },
  {
    id: 'mae-sai-temporary-checkpoint',
    name: 'Mae Sai Temporary Immigration Checkpoint',
    address: 'Temporary Border Checkpoint, Mae Sai, Chiang Rai 57130',
    city: 'Mae Sai',
    province: 'Chiang Rai',
    latitude: 20.4412,
    longitude: 99.8832,
    phone: '+66 53 732 028',
    hours: 'As announced',
    services: ['Temporary border checkpoint'],
    tips: []
  },
  {
    id: 'mae-chan-checkpoint',
    name: 'Mae Chan Immigration Checkpoint',
    address: 'Mae Chan District Office, Mae Chan, Chiang Rai 57110',
    city: 'Mae Chan',
    province: 'Chiang Rai',
    latitude: 20.1457,
    longitude: 99.8532,
    phone: '+66 53 771 702',
    hours: 'Mon-Fri 08:30-16:30',
    services: ['Border pass services'],
    tips: []
  },
  {
    id: 'chiang-saen-checkpoint',
    name: 'Chiang Saen Immigration Checkpoint',
    address: 'Chiang Saen Pier, Chiang Saen, Chiang Rai 57150',
    city: 'Chiang Saen',
    province: 'Chiang Rai',
    latitude: 20.2673,
    longitude: 100.0866,
    phone: '+66 53 777 091',
    hours: 'Daily 06:00-18:00',
    services: ['River border checkpoint'],
    tips: []
  },
  {
    id: 'chiang-khong-checkpoint',
    name: 'Chiang Khong Immigration Checkpoint',
    address: 'Fourth Thai–Lao Friendship Bridge, Chiang Khong, Chiang Rai 57140',
    city: 'Chiang Khong',
    province: 'Chiang Rai',
    latitude: 20.2617,
    longitude: 100.412,
    phone: '+66 53 791 126',
    hours: 'Daily 06:00-22:00',
    services: ['Friendship bridge border checkpoint'],
    tips: []
  }
];

export default immigrationOffices;
