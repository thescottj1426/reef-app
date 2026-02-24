"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, SimpleGrid, ActionIcon, Text, Stack } from "@mantine/core";
import { getPresignedUploadUrl, saveTankPhoto, deleteTankPhoto } from "@/features/tanks/actions";

type Photo = { id: string; url: string };

export function PhotoGallery({ tankId, photos: initial }: { tankId: string; photos: Photo[] }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPhotos(initial);
  }, [initial]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { presignedUrl, s3Key } = await getPresignedUploadUrl(tankId, file.name, file.type);

      const uploadRes = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadRes.ok) throw new Error("Upload to S3 failed");

      await saveTankPhoto(tankId, s3Key);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(photoId: string) {
    try {
      await deleteTankPhoto(photoId, tankId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <Stack>
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}

      <Group>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Upload photo
        </Button>
      </Group>

      {photos.length === 0 ? (
        <Text c="dimmed" size="sm">
          No photos yet.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
          {photos.map((photo) => (
            <div key={photo.id} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: "var(--mantine-radius-sm)" }}>
              <img
                src={photo.url}
                alt="Tank photo"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                style={{ position: "absolute", top: 6, right: 6 }}
                onClick={() => handleDelete(photo.id)}
                aria-label="Delete photo"
              >
                ×
              </ActionIcon>
            </div>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
