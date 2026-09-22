/** Cloudflare Worker entry point for the Factory site. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

type ImageOutputFormat = "image/avif" | "image/webp" | "image/jpeg" | "image/png" | "image/gif" | "rgb" | "rgba";

const imageOutputFormats = new Set<ImageOutputFormat>([
  "image/avif",
  "image/webp",
  "image/jpeg",
  "image/png",
  "image/gif",
  "rgb",
  "rgba",
]);

function isImageOutputFormat(format: string): format is ImageOutputFormat {
  return imageOutputFormats.has(format as ImageOutputFormat);
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          if (!isImageOutputFormat(format)) {
            throw new Error(`Unsupported optimized image format: ${format}`);
          }
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;

export default worker;
