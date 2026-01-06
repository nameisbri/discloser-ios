import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

const BUCKET_NAME = "test-documents";

export interface UploadResult {
  path: string;
  url: string;
}

/**
 * Upload a file to Supabase Storage
 * Files are stored in user-specific folders for RLS compliance
 */
export async function uploadTestDocument(
  fileUri: string,
  fileName: string
): Promise<UploadResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(fileUri, {
    encoding: "base64",
  });

  // Determine content type from extension
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const contentType = getContentType(ext);

  // Generate unique file path: userId/timestamp_filename
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${user.id}/${timestamp}_${sanitizedName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, decode(base64), {
      contentType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL (or signed URL if bucket is private)
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: urlData.publicUrl,
  };
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteTestDocument(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (error) throw error;
}

/**
 * Get a signed URL for a private file
 * Use this if the bucket is set to private
 */
export async function getSignedUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(filePath, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}

function getContentType(extension: string): string {
  const types: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    pdf: "application/pdf",
    heic: "image/heic",
  };
  return types[extension] || "application/octet-stream";
}

