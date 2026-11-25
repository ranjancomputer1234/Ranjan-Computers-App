import type {LearnerAddress} from '../../core/types';

export type AddressForm = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
};

export type ResolvedAddress = AddressForm & {
  id: string;
  label: string;
};

type GoogleComponent = {
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
  types?: string[];
};

export const blankAddress = (): AddressForm => ({
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
});

export function toAddressForm(value?: Partial<LearnerAddress> | null): AddressForm {
  return {
    addressLine1: value?.addressLine1?.trim() ?? '',
    addressLine2: value?.addressLine2?.trim() ?? '',
    city: value?.city?.trim() ?? '',
    state: value?.state?.trim() ?? '',
    pincode: value?.pincode?.trim() ?? '',
    placeId: value?.placeId?.trim() || undefined,
    latitude: finiteCoord(value?.latitude),
    longitude: finiteCoord(value?.longitude),
  };
}

export function compactAddress(value?: Partial<LearnerAddress> | null): LearnerAddress {
  if (!value) return {};
  const form = toAddressForm(value);
  const next: LearnerAddress = {};
  if (form.addressLine1) next.addressLine1 = form.addressLine1;
  if (form.addressLine2) next.addressLine2 = form.addressLine2;
  if (form.city) next.city = form.city.slice(0, 100);
  if (form.state) next.state = form.state;
  if (form.pincode) next.pincode = form.pincode;
  if (form.placeId) next.placeId = form.placeId;
  if (form.latitude != null) next.latitude = form.latitude;
  if (form.longitude != null) next.longitude = form.longitude;
  return next;
}

export function hasLearnerAddress(value?: Partial<LearnerAddress> | null): boolean {
  const address = compactAddress(value);
  return Boolean(
    address.addressLine1 || address.city || address.pincode || address.latitude != null,
  );
}

export function addressLabel(value?: Partial<LearnerAddress> | null): string {
  const form = toAddressForm(value);
  return [form.addressLine1, form.addressLine2, form.city, form.state, form.pincode]
    .filter(Boolean)
    .join(', ');
}

export function readComponent(components: GoogleComponent[] | undefined, type: string, short = false): string {
  const found = components?.find(item => item.types?.includes(type));
  if (!found) return '';
  const longValue = found.long_name ?? found.longText ?? '';
  const shortValue = found.short_name ?? found.shortText ?? longValue;
  return (short ? shortValue : longValue).trim();
}

export function addressFromGoogleResult(input: {
  id?: string;
  placeId?: string;
  formattedAddress?: string;
  components?: GoogleComponent[];
  latitude?: number;
  longitude?: number;
}): ResolvedAddress | undefined {
  const components = input.components;
  const street = [readComponent(components, 'street_number'), readComponent(components, 'route')]
    .filter(Boolean)
    .join(' ');
  const line1 = street || readComponent(components, 'premise');
  const line2 =
    readComponent(components, 'sublocality_level_1')
    || readComponent(components, 'sublocality')
    || readComponent(components, 'neighborhood');
  const city =
    readComponent(components, 'locality')
    || readComponent(components, 'administrative_area_level_3')
    || readComponent(components, 'administrative_area_level_2');
  const state = readComponent(components, 'administrative_area_level_1');
  const pincode = readComponent(components, 'postal_code');
  const latitude = finiteCoord(input.latitude);
  const longitude = finiteCoord(input.longitude);
  const formatted = input.formattedAddress?.trim() ?? '';
  const label = [line1, line2, city, state, pincode].filter(Boolean).join(', ') || formatted;
  if (!label && latitude == null) return undefined;
  return {
    id: input.placeId?.trim() || input.id?.trim() || (latitude != null ? `${latitude},${longitude}` : 'place'),
    label: label || 'Current location',
    addressLine1: line1 || (formatted ? formatted.split(',')[0]?.trim() ?? '' : ''),
    addressLine2: line2,
    city: city.slice(0, 100),
    state,
    pincode,
    placeId: input.placeId?.trim() || undefined,
    latitude,
    longitude,
  };
}

function finiteCoord(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}
