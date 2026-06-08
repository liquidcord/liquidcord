import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { React, useState } from "@webpack/common";
import { beginDiscordLogin, clearAuth, getCurrentAuthedUserId, pollAuth } from "../../api/auth";
import { useForceUpdater } from "@utils/react";

interface Props {
  onAuthedChange: () => void;
}

export function AuthSection({ onAuthedChange }: Props) {
  const forceUpdate = useForceUpdater();
  const [busy, setBusy] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authedUser, setAuthedUser] = React.useState<string | null>(null);

  const pollingRef = React.useRef<number | NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    getCurrentAuthedUserId().then((uid) => {
      setAuthedUser(uid);
    });

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current as any);
        pollingRef.current = null;
      }
    };
  }, []);

  const authed = !!authedUser;

  function clearCurrentPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current as any);
      pollingRef.current = null;
    }
  }

  async function handleConnect() {
    if (polling) return;

    setBusy(true);
    setError(null);
    setPolling(true);

    let pendingId: string;
    try {
      pendingId = beginDiscordLogin();
    } catch (e: any) {
      setBusy(false);
      setPolling(false);
      setError("Failed to open authorization window: " + (e?.message || "unknown"));
      return;
    }

    clearCurrentPolling();

    const start = Date.now();
    const maxWait = 1000 * 60 * 3;

    pollingRef.current = setInterval(async () => {
      try {
        if (Date.now() - start > maxWait) {
          clearCurrentPolling();
          setPolling(false);
          setBusy(false);
          setError("Timed out waiting for authorization. Authorize in the browser, then use the Refresh button.");
          return;
        }

        const result = await pollAuth(pendingId);
        if (result) {
          clearCurrentPolling();
          setPolling(false);
          setBusy(false);
          setAuthedUser(result.userId);
          onAuthedChange();
          forceUpdate();
        }
      } catch (e: any) {
        console.error("[Liquidcord] Auth poll error", e);
        clearCurrentPolling();
        setPolling(false);
        setBusy(false);
        setError(e?.message || "Error while waiting for authorization");
      }
    }, 1500);
  }

  async function handleDisconnect() {
    clearCurrentPolling();
    await clearAuth();
    setAuthedUser(null);
    onAuthedChange();
    forceUpdate();
  }

  return (
    <>
      <Heading className={Margins.top16}>Account</Heading>
      <Paragraph className={Margins.bottom16}>
        Connect your Discord account to manage and publish your Liquidcord profile. Other plugin users will see your customizations automatically.
      </Paragraph>

      {!authed ? (
        <>
          <Button onClick={handleConnect} disabled={busy || polling}>
            {polling ? "Waiting for browser authorization..." : "Connect with Discord"}
          </Button>
          <Paragraph className={Margins.top8} style={{ fontSize: 13, opacity: 0.8 }}>
            A browser window will open for Discord authorization. Once you approve, return here — Liquidcord will automatically detect it (no code to paste).
          </Paragraph>
          {error && <Notice.Danger className={Margins.top8}>{error}</Notice.Danger>}
        </>
      ) : (
        <>
          <Notice.Positive className={Margins.bottom8}>
            Connected as user ID: {authedUser}
          </Notice.Positive>
          <Button color="red" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </>
      )}
    </>
  );
}
