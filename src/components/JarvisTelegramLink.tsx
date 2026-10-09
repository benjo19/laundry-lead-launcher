import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bot, Copy, ShieldCheck } from "lucide-react";

type LinkChallenge = { challenge_id: string; token: string; expires_in_seconds: number };
export default function JarvisTelegramLink() {
  const [pending, setPending] = useState(false);
  const [challenge, setChallenge] = useState<LinkChallenge | null>(null);
  const begin = async () => {
    setPending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) throw new Error("Prvo se prijavite.");
      const { data, error } = await supabase.functions.invoke("jarvis-telegram-link-start", { method: "POST", body: {} });
      if (error || !data?.ok || !data?.token) throw new Error("Izdavanje koda nije uspjelo.");
      setChallenge(data as LinkChallenge);
      toast.success("Jednokratni kod je pripremljen.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Dogodila se pogreška.");
    } finally { setPending(false); }
  };
  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5" /> Jarvis — povezivanje Telegrama</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generirajte privremeni kod vezan uz vaš prijavljeni CRM račun. Telegram potvrda još nije aktivirana;
          ovaj korak ne povezuje račun i ne omogućuje izvršavanje Jarvis akcija.
        </p>
        <Button onClick={begin} disabled={pending}>{pending ? "Pripremam..." : "Generiraj jednokratni kod"}</Button>
        {challenge && (
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4" /> Kod vrijedi {Math.round(challenge.expires_in_seconds / 60)} minuta</div>
            <div className="font-mono break-all select-all text-xs" aria-label="Privremeni kod">{challenge.token}</div>
            <Button variant="outline" size="sm" onClick={async () => {
              try { await navigator.clipboard.writeText(challenge.token); toast.success("Kod kopiran."); }
              catch { toast.error("Kopiranje nije uspjelo."); }
            }}><Copy className="mr-2 h-4 w-4" /> Kopiraj kod</Button>
            <p className="text-xs text-muted-foreground">Ne dijelite kod u javnom chatu. Ne šaljite ga Jarvis botu dok ne uključimo verificirani Telegram ulaz.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
