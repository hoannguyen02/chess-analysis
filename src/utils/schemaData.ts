export const schemaData = {
  '@context': 'http://schema.org',
  logo: 'https://www.limachess.com/images/logo.svg',
  '@type': 'HealthAndBeautyBusiness',
  image: ['https://www.limachess.com/images/logo.svg'],
  name: 'LIMA CHESS',
  address: {
    '@type': 'PostalAddress',
    streetAddress:
      '29 Le Thi Hong Gam Street, Lien Nghia Ward, Duc Trong District, Lam Dong Province',
    addressLocality: 'Lam Dong',
    addressRegion: 'Duc Trong',
    postalCode: '66806',
    addressCountry: 'Vietnam',
  },
  review: {
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: 5,
      bestRating: '5',
    },
    author: {
      '@type': 'Person',
      name: 'Dai Phong',
    },
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 11.728253,
    longitude: 108.362901,
  },
  url: 'https://goo.gl/maps/9pBW75sAcabycU5v8',
  telephone: '+84912333224',
  servesCuisine: 'Vietnamese',
  priceRange: '300000 đ - 400000 đ',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '8:00',
      closes: '21:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday', 'Sunday'],
      opens: '8:30',
      closes: '21:00',
    },
  ],
  acceptsReservations: 'True',
};
