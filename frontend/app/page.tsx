import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AuthClient from "./AuthClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const { userId } = await auth();
  console.log("Auth Details:", { userId });
  if (userId) {
    redirect("/dashboard");
  }

  return <AuthClient />;
}
