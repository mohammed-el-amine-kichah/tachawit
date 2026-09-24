import { z } from "zod";

/** Folders of the public "images" bucket that admin editors upload to (see ImageField). */
export type ImageFolder = "culture" | "units" | "entries" | "lessons";

/** A path ImageField produced in `folder` (random id, allowed image type), or null to remove the image. */
export function imagePathSchema(folder: ImageFolder) {
  return z
    .string()
    .regex(new RegExp(`^${folder}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(png|jpg|webp|avif)$`))
    .nullable();
}
