import { UploadClient } from "@uploadcare/upload-client";

export const upload = new UploadClient({
    publicKey: process.env.NEXT_BUBLIC_UPLOAD_CARE_PUBLIC_KEY as string,
}) 