// Maps FDI tooth numbers to glTF model paths in /public/models/teeth/

const UPPER_MODELS: Record<number, string> = {
  1: 'maxillary_left_central_incisor',
  2: 'maxillary_lateral_incisor',
  3: 'maxillary_canine',
  4: 'maxillary_first_premolar',
  5: 'maxillary_second_premolar',
  6: 'maxillary_first_molar',
  7: 'maxillary_second_molar',
  8: 'maxillary_third_molar',
};

const LOWER_MODELS: Record<number, string> = {
  1: 'mandibular_left_central_incisor',
  2: 'mandibular_left_lateral_incisor',
  3: 'mandibular_left_canine',
  4: 'mandibular_first_premolar',
  5: 'mandibular_left_second_premolar',
  6: 'mandibular_first_molar',
  7: 'mandibular_second_molar',
  8: 'mandibular_third_molar',
};

export function getModelPath(fdi: number): string {
  const quadrant = Math.floor(fdi / 10);
  const digit = fdi % 10;
  const isUpper = quadrant === 1 || quadrant === 2;
  const folder = isUpper ? UPPER_MODELS[digit] : LOWER_MODELS[digit];
  if (!folder) return '';
  return `/models/teeth/${folder}/scene.gltf`;
}

export function shouldMirrorModel(fdi: number): boolean {
  const quadrant = Math.floor(fdi / 10);
  return quadrant === 1 || quadrant === 4;
}
