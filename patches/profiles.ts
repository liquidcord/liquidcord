import { FluxDispatcher } from "@webpack/common";
import { fetchProfile } from "../cache/profileCache";

let modalSub: any = null;
let popoutSub: any = null;
let updateSub: any = null;

export function startProfileSync() {
  modalSub = (payload: any) => {
    const uid = payload?.userId || payload?.user?.id || payload?.id;
    if (uid) fetchProfile(String(uid), true).catch(() => {});
  };
  popoutSub = (payload: any) => {
    const uid = payload?.userId || payload?.user?.id || payload?.id;
    if (uid) fetchProfile(String(uid), true).catch(() => {});
  };
  updateSub = (payload: any) => {
    const uid = payload?.userId || payload?.user?.id || payload?.id;
    if (uid) fetchProfile(String(uid)).catch(() => {});
  };
  try {
    FluxDispatcher.subscribe("USER_PROFILE_MODAL_OPEN", modalSub);
    FluxDispatcher.subscribe("USER_POPOUT_OPEN", popoutSub);
    FluxDispatcher.subscribe("USER_UPDATE", updateSub);
    FluxDispatcher.subscribe("SELECT_USER", updateSub);
  } catch {}
}

export function stopProfileSync() {
  try {
    if (modalSub) FluxDispatcher.unsubscribe("USER_PROFILE_MODAL_OPEN", modalSub);
    if (popoutSub) FluxDispatcher.unsubscribe("USER_POPOUT_OPEN", popoutSub);
    if (updateSub) FluxDispatcher.unsubscribe("USER_UPDATE", updateSub);
    if (updateSub) FluxDispatcher.unsubscribe("SELECT_USER", updateSub);
  } catch {}
  modalSub = null;
  popoutSub = null;
  updateSub = null;
}
