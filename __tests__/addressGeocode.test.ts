import {addressFromGoogleResult, compactAddress, hasLearnerAddress} from '../src/features/location/address';

describe('address geocoding', () => {
  it('maps Google address components onto the learner address fields', () => {
    const place = addressFromGoogleResult({
      placeId: 'ChIJexample',
      formattedAddress: '12 MG Road, Near City Mall, Patna, Bihar 800001, India',
      latitude: 25.5941,
      longitude: 85.1376,
      components: [
        {long_name: '12', short_name: '12', types: ['street_number']},
        {long_name: 'MG Road', short_name: 'MG Road', types: ['route']},
        {long_name: 'Near City Mall', short_name: 'Near City Mall', types: ['sublocality_level_1']},
        {long_name: 'Patna', short_name: 'Patna', types: ['locality']},
        {long_name: 'Bihar', short_name: 'BR', types: ['administrative_area_level_1']},
        {long_name: '800001', short_name: '800001', types: ['postal_code']},
      ],
    });

    expect(place).toMatchObject({
      addressLine1: '12 MG Road',
      addressLine2: 'Near City Mall',
      city: 'Patna',
      state: 'Bihar',
      pincode: '800001',
      placeId: 'ChIJexample',
      latitude: 25.5941,
      longitude: 85.1376,
    });
    expect(compactAddress(place)).toMatchObject({
      addressLine1: '12 MG Road',
      city: 'Patna',
      latitude: 25.5941,
    });
    expect(hasLearnerAddress(place)).toBe(true);
  });

  it('reads Places API (New) component names and keeps coordinates when the street is missing', () => {
    const place = addressFromGoogleResult({
      placeId: 'places/abc',
      latitude: 25.6,
      longitude: 85.1,
      components: [
        {longText: 'Patna', shortText: 'Patna', types: ['locality']},
        {longText: 'Bihar', shortText: 'BR', types: ['administrative_area_level_1']},
      ],
    });

    expect(place?.city).toBe('Patna');
    expect(place?.state).toBe('Bihar');
    expect(place?.addressLine1).toBe('');
    expect(place?.latitude).toBe(25.6);
    expect(hasLearnerAddress({})).toBe(false);
  });
});
