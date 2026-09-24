import "server-only";
import { listSpeakers } from "./queries";

export async function speakerOptions() {
  return (await listSpeakers()).map((s) => ({ id: s.id, name: s.display_name, consent: s.consent_given }));
}
