import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export type ImageUploadPreset =
  | "avatar"
  | "thumbnail"
  | "standard"
  | "document"
  | "idDocument";

export type ImageCompressOptions = {
  maxDimension?: number;
  compress?: number;
  /** Max base64 data-URI length (chars). Default tuned for ~100kb JSON body limits. */
  maxPayloadLength?: number;
  format?: ImageManipulator.SaveFormat;
};

export type PickImageSource = "library" | "camera";

export type PickImageOptions = {
  preset?: ImageUploadPreset;
  source?: PickImageSource;
  allowsEditing?: boolean;
  aspect?: [number, number];
  compress?: boolean | ImageCompressOptions;
  permissionMessage?: string;
};

export type PickedImage = {
  localUri: string;
  /** Base64 data URI ready for JSON API fields. */
  uploadValue: string;
  mimeType: string;
  width?: number;
  height?: number;
  /** Approximate upload string size in KB. */
  sizeKB: number;
};

type CompressStep = {
  maxDimension: number;
  compress: number;
};

/** Safe for Express default `express.json({ limit: "100kb" })` plus other profile fields. */
export const DEFAULT_MAX_PAYLOAD_LENGTH = 80_000;

const COMPRESS_STEPS: Record<ImageUploadPreset, CompressStep[]> = {
  avatar: [
    { maxDimension: 320, compress: 0.5 },
    { maxDimension: 256, compress: 0.4 },
    { maxDimension: 200, compress: 0.32 },
    { maxDimension: 160, compress: 0.25 },
    { maxDimension: 128, compress: 0.2 },
    { maxDimension: 96, compress: 0.15 },
  ],
  thumbnail: [
    { maxDimension: 200, compress: 0.45 },
    { maxDimension: 160, compress: 0.35 },
    { maxDimension: 128, compress: 0.28 },
    { maxDimension: 96, compress: 0.2 },
  ],
  standard: [
    { maxDimension: 1024, compress: 0.65 },
    { maxDimension: 768, compress: 0.55 },
    { maxDimension: 512, compress: 0.45 },
    { maxDimension: 384, compress: 0.35 },
    { maxDimension: 256, compress: 0.28 },
  ],
  document: [
    { maxDimension: 1280, compress: 0.7 },
    { maxDimension: 1024, compress: 0.6 },
    { maxDimension: 768, compress: 0.5 },
    { maxDimension: 512, compress: 0.4 },
    { maxDimension: 384, compress: 0.32 },
  ],
  idDocument: [
    { maxDimension: 480, compress: 0.55 },
    { maxDimension: 400, compress: 0.45 },
    { maxDimension: 320, compress: 0.35 },
    { maxDimension: 256, compress: 0.28 },
    { maxDimension: 200, compress: 0.22 },
  ],
};

export const IMAGE_UPLOAD_PRESETS: Record<
  ImageUploadPreset,
  Required<Pick<ImageCompressOptions, "maxPayloadLength" | "format">>
> = {
  avatar: {
    maxPayloadLength: DEFAULT_MAX_PAYLOAD_LENGTH,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  thumbnail: {
    maxPayloadLength: 120_000,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  standard: {
    maxPayloadLength: 350_000,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  document: {
    maxPayloadLength: 450_000,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  idDocument: {
    maxPayloadLength: 70_000,
    format: ImageManipulator.SaveFormat.JPEG,
  },
};

export function getImageTooLargeMessage() {
  return "This photo is too large after compression (about 80KB limit). Try another image, crop closer, or use a lower-resolution photo.";
}

export function getUploadSizeKB(uploadValue: string) {
  return Math.round((uploadValue.length / 1024) * 10) / 10;
}

function resolveCompressOptions(
  compress?: boolean | ImageCompressOptions,
  preset: ImageUploadPreset = "standard",
): ImageCompressOptions | null {
  if (compress === false) return null;

  const presetOptions = IMAGE_UPLOAD_PRESETS[preset];
  if (compress === true || compress === undefined) {
    return presetOptions;
  }

  return { ...presetOptions, ...compress };
}

function getMimeType(format: ImageManipulator.SaveFormat) {
  if (format === ImageManipulator.SaveFormat.PNG) return "image/png";
  if (format === ImageManipulator.SaveFormat.WEBP) return "image/webp";
  return "image/jpeg";
}

async function compressStep(
  uri: string,
  step: CompressStep,
  format: ImageManipulator.SaveFormat,
) {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: step.maxDimension } }],
    {
      compress: step.compress,
      format,
      base64: true,
    },
  );

  if (!result.base64) return null;

  const mimeType = getMimeType(format);
  const dataUri = `data:${mimeType};base64,${result.base64}`;

  return {
    dataUri,
    mimeType,
    width: result.width,
    height: result.height,
  };
}

/**
 * Iteratively resize/compress until the payload fits under maxPayloadLength.
 * Runs immediately after the user picks an image — before any API call.
 */
export async function prepareImageForUpload(
  uri: string,
  options?: ImageCompressOptions | ImageUploadPreset,
): Promise<PickedImage | null> {
  const preset =
    typeof options === "string" ? options : ("standard" as ImageUploadPreset);

  const presetConfig = IMAGE_UPLOAD_PRESETS[preset];
  const custom =
    typeof options === "object" && options !== null ? options : undefined;

  const maxPayloadLength =
    custom?.maxPayloadLength ?? presetConfig.maxPayloadLength;
  const format = custom?.format ?? presetConfig.format;
  const steps = COMPRESS_STEPS[preset];

  let smallest: Awaited<ReturnType<typeof compressStep>> = null;

  for (const step of steps) {
    const compressed = await compressStep(uri, step, format);
    if (!compressed) continue;

    smallest = compressed;

    if (compressed.dataUri.length <= maxPayloadLength) {
      return {
        localUri: uri,
        uploadValue: compressed.dataUri,
        mimeType: compressed.mimeType,
        width: compressed.width,
        height: compressed.height,
        sizeKB: getUploadSizeKB(compressed.dataUri),
      };
    }
  }

  return null;
}

async function requestPermission(
  source: PickImageSource,
  permissionMessage?: string,
) {
  const result =
    source === "camera"
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (result.granted) return true;

  Alert.alert(
    "Permission required",
    permissionMessage ??
      (source === "camera"
        ? "Allow camera access to take a photo."
        : "Allow photo library access to choose an image."),
  );
  return false;
}

async function launchPicker(source: PickImageSource, options: PickImageOptions) {
  return source === "camera"
    ? ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: options.allowsEditing ?? false,
        aspect: options.aspect,
        quality: 0.5,
      })
    : ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: options.allowsEditing ?? false,
        aspect: options.aspect,
        quality: 0.5,
      });
}

export async function pickImage(
  options: PickImageOptions = {},
): Promise<PickedImage | null> {
  const source = options.source ?? "library";
  const preset = options.preset ?? "standard";

  const hasPermission = await requestPermission(source, options.permissionMessage);
  if (!hasPermission) return null;

  const result = await launchPicker(source, options);
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const compressOptions = resolveCompressOptions(options.compress, preset);

  if (!compressOptions) {
    return {
      localUri: asset.uri,
      uploadValue: asset.uri,
      mimeType: asset.mimeType ?? "image/jpeg",
      width: asset.width,
      height: asset.height,
      sizeKB: 0,
    };
  }

  const prepared = await prepareImageForUpload(
    asset.uri,
    typeof options.compress === "object"
      ? { ...IMAGE_UPLOAD_PRESETS[preset], ...options.compress }
      : preset,
  );

  if (!prepared) {
    Alert.alert("Image too large", getImageTooLargeMessage());
    return null;
  }

  return {
    ...prepared,
    localUri: asset.uri,
    width: prepared.width ?? asset.width,
    height: prepared.height ?? asset.height,
  };
}

export function pickImageFromLibrary(
  options: Omit<PickImageOptions, "source"> = {},
) {
  return pickImage({ ...options, source: "library" });
}

export function pickImageFromCamera(
  options: Omit<PickImageOptions, "source"> = {},
) {
  return pickImage({ ...options, source: "camera" });
}

export function pickImageWithSourceChoice(
  options: Omit<PickImageOptions, "source"> = {},
): Promise<PickedImage | null> {
  return new Promise((resolve) => {
    Alert.alert(
      "Add Photo",
      "Choose how you want to add a photo",
      [
        {
          text: "Take Photo",
          onPress: () => {
            void pickImage({ ...options, source: "camera" }).then(resolve);
          },
        },
        {
          text: "Choose from Gallery",
          onPress: () => {
            void pickImage({ ...options, source: "library" }).then(resolve);
          },
        },
        { text: "Cancel", style: "cancel", onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
