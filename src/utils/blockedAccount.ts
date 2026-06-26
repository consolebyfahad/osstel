type BlockedAccountHandler = () => void | Promise<void>;

let handler: BlockedAccountHandler | null = null;
let handling = false;

export function registerBlockedAccountHandler(fn: BlockedAccountHandler) {
  handler = fn;
  return () => {
    handler = null;
  };
}

export async function notifyBlockedAccount(): Promise<boolean> {
  if (handling || !handler) return false;
  handling = true;
  try {
    await handler();
    return true;
  } finally {
    handling = false;
  }
}
