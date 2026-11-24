import {Linking, NativeModules, PermissionsAndroid, Platform} from 'react-native';
import {appConfig} from '../../core/config';
import {
  addressFromGoogleResult,
  addressLabel,
  toAddressForm,
  type AddressForm,
  type ResolvedAddress,
} from './address';

export type {AddressForm, ResolvedAddress};

type NativePlace = Partial<ResolvedAddress> & {label?: string; city?: string};

type NativeLocation = {
  currentAddress: () => Promise<NativePlace>;
  currentCoordinates: () => Promise<{latitude?: number; longitude?: number}>;
  searchPlaces: (query: string) => Promise<NativePlace[]>;
  mapsIdentity: () => Promise<{packageName?: string; certSha1?: string}>;
};

const native = NativeModules.RaciLocation as NativeLocation | undefined;

export class LocationError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'LocationError';
  }
}

let locationRequest: Promise<void> | null = null;
let mapsIdentityRequest: Promise<{packageName: string; certSha1: string}> | null = null;

function finite(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function asResolved(value: NativePlace | null | undefined, fallbackId: string): ResolvedAddress | undefined {
  if (!value) return undefined;
  const form = toAddressForm(value);
  const label = value.label?.trim() || addressLabel(form);
  const city = form.city || label.split(',')[0]?.trim().slice(0, 100) || '';
  if (!label && !city && form.latitude == null) return undefined;
  return {
    ...form,
    city,
    id: value.id?.trim() || value.placeId?.trim() || fallbackId,
    label: label || city,
    placeId: form.placeId,
  };
}

export async function ensureLocationPermission(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (locationRequest) return locationRequest;
  locationRequest = requestLocationPermission().finally(() => {
    locationRequest = null;
  });
  return locationRequest;
}

async function requestLocationPermission(): Promise<void> {
  const fine = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  const coarse = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;
  if (await PermissionsAndroid.check(fine) || await PermissionsAndroid.check(coarse)) return;
  const result = await PermissionsAndroid.requestMultiple([fine, coarse]);
  const granted = result[fine] === PermissionsAndroid.RESULTS.GRANTED
    || result[coarse] === PermissionsAndroid.RESULTS.GRANTED;
  if (granted) return;
  const blocked = result[fine] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
    || result[coarse] === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
  throw new LocationError(
    blocked ? 'location_permission_blocked' : 'location_permission_denied',
    blocked
      ? 'Location is turned off for RACI. Enable it in Settings, or type your address.'
      : 'Location permission is off. You can still type your address.',
  );
}

export function openLocationSettings(): Promise<void> {
  return Linking.openSettings().catch(() => undefined);
}

async function mapsHeaders(): Promise<Record<string, string>> {
  const key = appConfig.googleMapsApiKey;
  if (!key) return {};
  const headers: Record<string, string> = {'X-Goog-Api-Key': key};
  if (Platform.OS !== 'android' || !native?.mapsIdentity) return headers;
  try {
    mapsIdentityRequest ??= native.mapsIdentity().then(identity => ({
      packageName: identity.packageName?.trim() ?? '',
      certSha1: identity.certSha1?.trim().toLowerCase() ?? '',
    })).catch(() => ({packageName: '', certSha1: ''}));
    const identity = await mapsIdentityRequest;
    if (identity.packageName && identity.certSha1) {
      headers['X-Android-Package'] = identity.packageName;
      headers['X-Android-Cert'] = identity.certSha1;
    }
  } catch {
    mapsIdentityRequest = null;
  }
  return headers;
}

async function googleReverseGeocode(latitude: number, longitude: number): Promise<ResolvedAddress | undefined> {
  const key = appConfig.googleMapsApiKey;
  if (!key) return undefined;
  const headers = await mapsHeaders();
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&language=en&region=in&key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {headers});
  if (!response.ok) return undefined;
  const payload = await response.json() as {
    status?: string;
    results?: Array<{
      place_id?: string;
      formatted_address?: string;
      address_components?: Array<{long_name?: string; short_name?: string; types?: string[]}>;
      geometry?: {location?: {lat?: number; lng?: number}};
    }>;
  };
  if (payload.status && payload.status !== 'OK') return undefined;
  const result = payload.results?.[0];
  if (!result) return undefined;
  return addressFromGoogleResult({
    placeId: result.place_id,
    formattedAddress: result.formatted_address,
    components: result.address_components,
    latitude: finite(result.geometry?.location?.lat) ?? latitude,
    longitude: finite(result.geometry?.location?.lng) ?? longitude,
  });
}

async function googlePlaceDetails(placeId: string): Promise<ResolvedAddress | undefined> {
  const key = appConfig.googleMapsApiKey;
  if (!key || !placeId) return undefined;
  const headers = await mapsHeaders();
  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: {
      ...headers,
      'X-Goog-FieldMask': 'id,formattedAddress,addressComponents,location',
    },
  });
  if (!response.ok) return undefined;
  const payload = await response.json() as {
    id?: string;
    formattedAddress?: string;
    addressComponents?: Array<{longText?: string; shortText?: string; types?: string[]}>;
    location?: {latitude?: number; longitude?: number};
  };
  return addressFromGoogleResult({
    placeId: payload.id || placeId,
    formattedAddress: payload.formattedAddress,
    components: payload.addressComponents,
    latitude: finite(payload.location?.latitude),
    longitude: finite(payload.location?.longitude),
  });
}

async function deviceAddress(): Promise<ResolvedAddress> {
  if (!native?.currentAddress) {
    throw new LocationError('location_unavailable', 'Location services are not available on this device. Type your address instead.');
  }
  const place = asResolved(await native.currentAddress(), 'current');
  if (!place) throw new LocationError('location_unavailable', 'Your address could not be read. Type your address instead.');
  return place;
}

export async function locateCurrentAddress(): Promise<ResolvedAddress> {
  await ensureLocationPermission();
  if (appConfig.googleMapsApiKey && native?.currentCoordinates) {
    try {
      const coords = await native.currentCoordinates();
      const latitude = finite(coords.latitude);
      const longitude = finite(coords.longitude);
      if (latitude == null || longitude == null) {
        throw new LocationError('location_unavailable', 'Your location could not be read. Type your address instead.');
      }
      const geocoded = await googleReverseGeocode(latitude, longitude);
      if (geocoded) return geocoded;
    } catch (error) {
      if (error instanceof LocationError && error.code !== 'location_unavailable') throw error;
    }
  }
  try {
    return await deviceAddress();
  } catch (error) {
    if (error instanceof LocationError) throw error;
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'location_unavailable';
    const message = error && typeof error === 'object' && 'message' in error
      ? String(error.message)
      : 'Your address could not be read. Type your address instead.';
    throw new LocationError(code, message);
  }
}

async function googlePlaceSuggestions(query: string): Promise<ResolvedAddress[]> {
  const key = appConfig.googleMapsApiKey;
  if (!key) return [];
  try {
    const headers = await mapsHeaders();
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text',
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ['in'],
        languageCode: 'en',
      }),
    });
    if (!response.ok) return [];
    const payload = await response.json() as {
      suggestions?: Array<{placePrediction?: {placeId?: string; text?: {text?: string}}}>;
    };
    return (payload.suggestions ?? []).flatMap((item, index) => {
      const label = item.placePrediction?.text?.text?.trim() ?? '';
      const placeId = item.placePrediction?.placeId?.trim();
      if (!label) return [];
      return [{
        ...blankSuggestion(placeId || `places-${index}`, label),
        placeId,
      }];
    });
  } catch {
    return [];
  }
}

function blankSuggestion(id: string, label: string): ResolvedAddress {
  const city = label.split(',')[0]?.trim().slice(0, 100) || label.slice(0, 100);
  return {
    id,
    label,
    addressLine1: '',
    addressLine2: '',
    city,
    state: '',
    pincode: '',
  };
}

export async function searchAddress(query: string): Promise<ResolvedAddress[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const [places, local] = await Promise.all([
    googlePlaceSuggestions(trimmed),
    native?.searchPlaces ? native.searchPlaces(trimmed).catch(() => [] as NativePlace[]) : Promise.resolve([]),
  ]);
  const seen = new Set<string>();
  const merged: ResolvedAddress[] = [];
  for (const item of [...places, ...local.map((place, index) => asResolved(place, `local-${index}`)).filter((place): place is ResolvedAddress => Boolean(place))]) {
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(0, 6);
}

export async function resolvePlace(place: ResolvedAddress): Promise<ResolvedAddress> {
  if (place.placeId && appConfig.googleMapsApiKey && !place.addressLine1 && place.latitude == null) {
    const detailed = await googlePlaceDetails(place.placeId);
    if (detailed) return detailed;
  }
  return place;
}

export function formFromResolved(place: ResolvedAddress): AddressForm {
  return toAddressForm(place);
}
