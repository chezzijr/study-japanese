import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { Dictionary } from '$lib/types/vocab';
import importUnit from '$lib/unit_import';

export const load: PageLoad = async ({ params }) => {
  // in folder n5, list all files
  const unit = params.unit;
  return importUnit(unit)
};
