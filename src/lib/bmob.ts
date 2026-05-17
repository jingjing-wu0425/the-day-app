import Bmob from "hydrogen-js-sdk";

let initialized = false;

export function initBmob() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  Bmob.initialize(
    process.env.NEXT_PUBLIC_BMOB_SECRET_KEY!,
    process.env.NEXT_PUBLIC_BMOB_SECURITY_CODE!,
  );
  initialized = true;
}

export default Bmob;
