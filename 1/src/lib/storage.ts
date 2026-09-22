import { supabase } from "./supabase";

const BUCKET = "portfolio";

/**
 * Uploads a file to the public `portfolio` Supabase Storage bucket and
 * returns its public URL. Requires migration 004 (bucket + policies) to
 * have been run — see supabase/migrations/004_profile_storage_realtime.sql.
 */
export async function uploadToPortfolioBucket(file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
