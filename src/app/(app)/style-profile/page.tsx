import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { StyleDNAClient } from "@/components/style-profile/StyleDNAClient";

export default async function StyleProfilePage() {
  const user = await requireUser();

  const profile = await prisma.styleProfile.findUnique({
    where: { userId: user.id },
  });

  return <StyleDNAClient initialProfile={profile} />;
}
