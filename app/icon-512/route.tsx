import { createAppIcon } from "@/lib/pwa/app-icon";

export function GET() {
  return createAppIcon(512);
}
