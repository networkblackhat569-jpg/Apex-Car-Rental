import { Vehicle } from '../types';

/**
 * Apex Car Rental - Single Source of Truth Fleet Database
 * Business owners can update vehicle names, images, prices, specs, and client photos here.
 * 
 * STRICT MATCHING GUARANTEE:
 * Each vehicle image corresponds exclusively to that exact vehicle model.
 * Never substitute generic or cross-model photography.
 */
export const initialVehicles: Vehicle[] = [
  {
    id: 'toyota-corolla-2024',
    name: 'Toyota Corolla',
    model: 'Toyota Corolla Altis 1.6',
    year: '2024',
    category: 'Sedan',
    transmission: 'Automatic',
    seats: 5,
    fuel: 'Petrol',
    pricePerDay: 'PKR 6,500',
    weeklyPrice: 'PKR 42,000',
    image: '/images/toyota-corolla.jpg',
    description: 'The definitive standard in dependable luxury. Refined suspension, generous trunk capacity, and whisper-quiet cabin for smooth executive transit and family journeys.',
    features: [
      'Dual-Zone Auto Climate Control',
      'Infotainment with Apple CarPlay & Android Auto',
      'Rear Camera with Dynamic Guidelines',
      'Cruise Control & Eco Drive Mode',
      '7 SRS Airbags & ABS with EBD',
      'Push Button Start & Smart Keyless Entry'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 25,000.',
    strictModelCode: 'toyota-corolla',
    engineCapacity: '1598 cc Dual VVT-i',
    fuelAverage: '14-16 km/L',
    hasAC: true,
    gallery: {
      front: '/images/toyota-corolla.jpg',
      side: '/images/toyota-corolla.jpg',
      rear: '/images/toyota-corolla.jpg',
      interior: '/images/toyota-corolla.jpg'
    }
  },
  {
    id: 'toyota-yaris-2024',
    name: 'Toyota Yaris',
    model: 'Toyota Yaris ATIV X CVT',
    year: '2024',
    category: 'Compact Sedan',
    transmission: 'Automatic',
    seats: 5,
    fuel: 'Petrol',
    pricePerDay: 'PKR 5,500',
    weeklyPrice: 'PKR 35,000',
    image: '/images/toyota-yaris.jpg',
    description: 'Agile, ultra fuel-efficient, and effortless to maneuver through congested urban centers. Packed with modern connectivity and comfort for everyday commutes.',
    features: [
      'Digital Multi-Information Display',
      'High-Efficiency CVT with 7-Speed Sequential Shift',
      'Steering-Mounted Media Controls',
      'Reverse Parking Sensors & Camera',
      'Traction Control & Hill-Start Assist',
      'Chilled Glovebox & Premium Fabric Seats'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 20,000.',
    strictModelCode: 'toyota-yaris',
    engineCapacity: '1329 cc Dual VVT-i',
    fuelAverage: '16-18 km/L',
    hasAC: true,
    gallery: {
      front: '/images/toyota-yaris.jpg',
      side: '/images/toyota-yaris.jpg',
      rear: '/images/toyota-yaris.jpg',
      interior: '/images/toyota-yaris.jpg'
    }
  },
  {
    id: 'honda-civic-2024',
    name: 'Honda Civic',
    model: 'Honda Civic RS 1.5L Turbo',
    year: '2024',
    category: 'Sedan',
    transmission: 'Automatic',
    seats: 5,
    fuel: 'Petrol',
    pricePerDay: 'PKR 9,500',
    weeklyPrice: 'PKR 62,000',
    image: '/images/honda-civic.jpg',
    description: 'Dynamic sports sedan styling with turbocharged performance. Boasts Honda SENSING driver-assist technology, low center of gravity, and a commanding executive road presence.',
    features: [
      '1.5L VTEC Turbocharged Powertrain',
      'Honda SENSING Suite (Adaptive Cruise & Lane Keep)',
      '10.2-inch Full Digital Driver Display',
      'Wireless Apple CarPlay & Qi Smartphone Charger',
      'Electric Sunroof & Dual Exhaust Garnish',
      'Premium 8-Speaker Audio System'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 35,000.',
    strictModelCode: 'honda-civic',
    engineCapacity: '1498 cc Turbocharged',
    fuelAverage: '12-14 km/L',
    hasAC: true,
    gallery: {
      front: '/images/honda-civic.jpg',
      side: '/images/honda-civic.jpg',
      rear: '/images/honda-civic.jpg',
      interior: '/images/honda-civic.jpg'
    }
  },
  {
    id: 'honda-city-2024',
    name: 'Honda City',
    model: 'Honda City 1.5L Aspire CVT',
    year: '2024',
    category: 'Sedan',
    transmission: 'Automatic',
    seats: 5,
    fuel: 'Petrol',
    pricePerDay: 'PKR 6,000',
    weeklyPrice: 'PKR 39,000',
    image: '/images/honda-city.jpg',
    description: 'Class-leading rear legroom, plush leather stitched appointments, and refined Japanese engineering. The ideal chauffeur-driven or self-drive choice for city and inter-city travel.',
    features: [
      '9-inch Touchscreen Navigation Unit',
      'Aspire High-Grade Leather Interior',
      'Smart Entry with Push Start Button',
      'Cruise Control & Steering Paddle Shifters',
      'Automatic Climate Control with Rear Vents',
      'Emergency Stop Signal & ISOFIX Anchors'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 20,000.',
    strictModelCode: 'honda-city',
    engineCapacity: '1497 cc i-VTEC',
    fuelAverage: '15-17 km/L',
    hasAC: true,
    gallery: {
      front: '/images/honda-city.jpg',
      side: '/images/honda-city.jpg',
      rear: '/images/honda-city.jpg',
      interior: '/images/honda-city.jpg'
    }
  },
  {
    id: 'kia-sportage-2024',
    name: 'Kia Sportage',
    model: 'Kia Sportage AWD Alpha/FWD',
    year: '2024',
    category: 'SUV',
    transmission: 'Automatic',
    seats: 5,
    fuel: 'Petrol',
    pricePerDay: 'PKR 11,000',
    weeklyPrice: 'PKR 72,000',
    image: '/images/kia-sportage.jpg',
    description: 'Uncompromising luxury crossover SUV. Featuring elevated cockpit visibility, panoramic glass roof, intelligent AWD grip, and lavish ride isolation over all road surfaces.',
    features: [
      'Expansive Panoramic Sunroof',
      'Dynamax All-Wheel Drive (AWD) with Lock Mode',
      'Electric 8-Way Adjustable Driver & Passenger Seats',
      'Power Tailgate with Hands-Free Proximity Sensor',
      'Bi-Xenon Projection Headlamps with Boomerang DRL',
      'Vehicle Stability Management & Downhill Brake'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 40,000.',
    strictModelCode: 'kia-sportage',
    engineCapacity: '1999 cc MPI Nu Engine',
    fuelAverage: '10-12 km/L',
    hasAC: true,
    gallery: {
      front: '/images/kia-sportage.jpg',
      side: '/images/kia-sportage.jpg',
      rear: '/images/kia-sportage.jpg',
      interior: '/images/kia-sportage.jpg'
    }
  },
  {
    id: 'toyota-fortuner-2024',
    name: 'Toyota Fortuner',
    model: 'Toyota Fortuner Legender 2.8L Sigma 4',
    year: '2024',
    category: 'SUV',
    transmission: 'Automatic',
    seats: 7,
    fuel: 'Diesel',
    pricePerDay: 'PKR 18,500',
    weeklyPrice: 'PKR 120,000',
    image: '/images/toyota-fortuner.jpg',
    description: 'Flagship 7-seater body-on-frame 4x4 SUV. Massive 500 Nm torque output for mountain expeditions, VIP delegations, protocol escorts, and supreme highway cruising.',
    features: [
      'Heavy-Duty 4WD with High/Low Range & Differential Lock',
      '7-Passenger Executive 3-Row Seating',
      'Chilled Center Console Storage & Dual AC Coolers',
      'Sequential LED Signal Lamps & Quad Projectors',
      'Paddle Shifters with Normal / Eco / Sport Drive Modes',
      'Rugged Body-on-Frame High Clearance Chassis'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 60,000.',
    strictModelCode: 'toyota-fortuner',
    engineCapacity: '2755 cc 1GD-FTV Turbo Diesel',
    fuelAverage: '9-11 km/L',
    hasAC: true,
    gallery: {
      front: '/images/toyota-fortuner.jpg',
      side: '/images/toyota-fortuner.jpg',
      rear: '/images/toyota-fortuner.jpg',
      interior: '/images/toyota-fortuner.jpg'
    }
  },
  {
    id: 'toyota-grande-2024',
    name: 'Toyota Grande',
    model: 'Toyota Corolla Altis Grande 1.8 CVT-i',
    year: '2024',
    category: 'Luxury Sedan',
    transmission: 'Automatic',
    seats: 5,
    fuel: 'Petrol',
    pricePerDay: 'PKR 7,500',
    weeklyPrice: 'PKR 49,000',
    image: '/images/toyota-grande.jpg',
    description: 'The crowning trim of the Corolla lineup. Combines a potent 1.8L Dual VVT-i engine, sunroof, ivory stitched upholstery, and paddle shifters for premier comfort.',
    features: [
      'Electric Sunroof with Tilt & Slide Function',
      'Paddle Shifters with 7-Speed Sport CVT-i',
      'Optitron Luxury Meter with 4.2-inch Color TFT',
      'Dual VVT-i 138 HP High Output Engine',
      'Cruise Control & Vehicle Stability Control (VSC)',
      'Rear Seat Armrest with Integrated Cupholders'
    ],
    availability: 'Available',
    rentalTerms: 'Standard daily limit 200 km. Valid original CNIC/Passport & Driver License required. Refundable security deposit: PKR 30,000.',
    strictModelCode: 'toyota-grande',
    engineCapacity: '1798 cc Dual VVT-i',
    fuelAverage: '13-15 km/L',
    hasAC: true,
    gallery: {
      front: '/images/toyota-grande.jpg',
      side: '/images/toyota-grande.jpg',
      rear: '/images/toyota-grande.jpg',
      interior: '/images/toyota-grande.jpg'
    }
  }
];

export const WHATSAPP_PHONE_NUMBER = '+923001234567'; // Default booking hotline

/**
 * Builds the exact required WhatsApp booking URL
 * Automatically binds the exact vehicle name to the booking text
 */
export function getWhatsAppBookingUrl(vehicleName: string, phoneNumber = WHATSAPP_PHONE_NUMBER): string {
  const message = `Hello, I am interested in renting the ${vehicleName}. Please share availability and rental details.`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber.replace(/[^0-9]/g, '')}?text=${encoded}`;
}
