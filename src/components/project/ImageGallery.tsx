import Image from "next/image";
import type { CoverImage } from "@/types/content";

type ImageGalleryProps = {
  images: CoverImage[];
};

export function ImageGallery({ images }: ImageGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {images.map((image) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={900}
          height={600}
          className="aspect-[3/2] rounded-2xl border border-border bg-subtle object-cover"
        />
      ))}
    </div>
  );
}
